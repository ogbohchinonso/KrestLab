/**
 * tutor.js — AI Tutor panel logic
 */
window.Tutor = (() => {

  let activeCurriculum = null;

  function init() {
    // Open/close panel
    document.getElementById('btnTutor').addEventListener('click', _openPanel);
    document.getElementById('btnCloseTutor').addEventListener('click', _closePanel);

    // Generate curriculum
    document.getElementById('btnGenerateCurriculum').addEventListener('click', _generateCurriculum);

    // Tutor actions
    document.getElementById('btnHint').addEventListener('click', _getHint);
    document.getElementById('btnReview').addEventListener('click', _reviewCode);
    document.getElementById('btnNextStep').addEventListener('click', _nextStep);
    document.getElementById('btnLoadStarter').addEventListener('click', _loadStarter);
    document.getElementById('btnAskTutor').addEventListener('click', _askQuestion);
    document.getElementById('tutorQuestion').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') _askQuestion();
    });
  }

  function _openPanel() {
    document.getElementById('tutorPanel').classList.remove('hidden');
    Editor.refresh();
  }

  function _closePanel() {
    document.getElementById('tutorPanel').classList.add('hidden');
    Editor.refresh();
  }

  async function _generateCurriculum() {
    if (!Auth.isLoggedIn()) {
      window.App.toast('Please log in to use the AI Tutor.');
      return;
    }

    const topic = document.getElementById('tutorTopic').value.trim();
    const lang  = document.getElementById('tutorLang').value;
    if (!topic) { window.App.toast('Please enter a topic.'); return; }

    _showLoading('Generating your curriculum…');

    try {
      const { curriculum } = await API.tutorAction({ action: 'curriculum', topic, language: lang, context: {} });
      activeCurriculum = curriculum;
      _renderCurriculum(curriculum);
    } catch (err) {
      window.App.toast(err.message || 'Failed to generate curriculum.');
      _showStart();
    }
  }

  function _renderCurriculum(curriculum) {
    activeCurriculum = curriculum;

    document.getElementById('tutorStart').classList.add('hidden');
    document.getElementById('tutorLoading').classList.add('hidden');
    document.getElementById('tutorCurriculum').classList.remove('hidden');

    const step = curriculum.steps[curriculum.currentStep];

    document.getElementById('curriculumTopic').textContent    = curriculum.topic;
    document.getElementById('curriculumProgress').textContent = `${curriculum.completedSteps}/${curriculum.totalSteps} steps`;
    document.getElementById('progressFill').style.width       = `${(curriculum.completedSteps / curriculum.totalSteps) * 100}%`;

    if (step) _renderStep(step, curriculum.currentStep, curriculum.totalSteps);
  }

  function _renderStep(step, index, total) {
    document.getElementById('stepNumber').textContent     = `Step ${index + 1} of ${total}`;
    document.getElementById('stepTitle').textContent      = step.title;
    document.getElementById('stepObjective').textContent  = step.objective;
    document.getElementById('stepExplanation').textContent = step.explanation;
    document.getElementById('tutorResponse').textContent  = '';
    document.getElementById('tutorResponse').classList.remove('visible');
  }

  function _loadStarter() {
    if (!activeCurriculum) return;
    const step = activeCurriculum.steps[activeCurriculum.currentStep];
    if (!step?.starterCode) { window.App.toast('No starter code for this step.'); return; }
    Editor.switchTo(activeCurriculum.language, step.starterCode);
    window.App.toast('Starter code loaded into editor.');
  }

  async function _getHint() {
    if (!activeCurriculum) return;
    const step = activeCurriculum.steps[activeCurriculum.currentStep];
    _setResponse('Getting a hint…');
    try {
      const { hint } = await API.tutorAction({
        action: 'hint', language: activeCurriculum.language,
        code:    Editor.getValue(activeCurriculum.language),
        context: { stepTitle: step?.title },
        question: '',
      });
      _setResponse(hint);
    } catch (err) { _setResponse(`Error: ${err.message}`); }
  }

  async function _reviewCode() {
    if (!activeCurriculum) return;
    const step = activeCurriculum.steps[activeCurriculum.currentStep];
    _setResponse('Reviewing your code…');
    try {
      const { review } = await API.tutorAction({
        action: 'review', language: activeCurriculum.language,
        code:   Editor.getValue(activeCurriculum.language),
        context: { stepObjective: step?.objective, expectedOutput: step?.solution },
      });
      const lines = [
        `${review.passed ? '✅ Passed' : '❌ Needs work'} — Score: ${review.score}/100`,
        review.summary,
        review.positives?.length ? `\n✓ ${review.positives.join('\n✓ ')}` : '',
        review.issues?.length    ? `\n✗ ${review.issues.map(i => i.description).join('\n✗ ')}` : '',
        review.nextSuggestion ? `\n→ ${review.nextSuggestion}` : '',
      ];
      _setResponse(lines.filter(Boolean).join('\n'));
    } catch (err) { _setResponse(`Error: ${err.message}`); }
  }

  async function _nextStep() {
    if (!activeCurriculum) return;
    _setResponse('');
    _showLoading('Loading next step…');
    try {
      const { curriculum, completed } = await API.tutorAction({
        action: 'next_step', context: { curriculumId: activeCurriculum._id },
      });
      if (completed) {
        activeCurriculum = curriculum;
        _showLoading('');
        document.getElementById('tutorLoading').classList.add('hidden');
        document.getElementById('tutorCurriculum').classList.remove('hidden');
        _setResponse('🎉 Curriculum complete! Check your dashboard for your XP.');
        document.getElementById('btnNextStep').disabled = true;
      } else {
        _renderCurriculum(curriculum);
      }
    } catch (err) {
      _showStart();
      window.App.toast(err.message || 'Failed to advance step.');
    }
  }

  async function _askQuestion() {
    if (!Auth.isLoggedIn()) { window.App.toast('Please log in to use the AI Tutor.'); return; }
    const question = document.getElementById('tutorQuestion').value.trim();
    if (!question) return;

    document.getElementById('tutorQuestion').value = '';
    _setResponse('Thinking…');

    try {
      const { explanation } = await API.tutorAction({
        action:   'explain',
        question,
        language: activeCurriculum?.language || Editor.getActiveLang(),
        code:     Editor.getValue(Editor.getActiveLang()),
        topic:    question,
      });
      _setResponse(explanation);
    } catch (err) { _setResponse(`Error: ${err.message}`); }
  }

  function _setResponse(text) {
    const el = document.getElementById('tutorResponse');
    el.textContent = text;
    el.classList.toggle('visible', !!text);
  }

  function _showLoading(msg) {
    document.getElementById('tutorStart').classList.add('hidden');
    document.getElementById('tutorCurriculum').classList.add('hidden');
    document.getElementById('tutorLoading').classList.remove('hidden');
    document.getElementById('tutorLoadingMsg').textContent = msg;
  }

  function _showStart() {
    document.getElementById('tutorLoading').classList.add('hidden');
    document.getElementById('tutorCurriculum').classList.add('hidden');
    document.getElementById('tutorStart').classList.remove('hidden');
  }

  // Load a curriculum from the dashboard
  function loadCurriculum(curriculum) {
    _openPanel();
    _renderCurriculum(curriculum);
  }

  return { init, loadCurriculum };
})();
