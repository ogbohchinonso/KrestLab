const express    = require('express');
const { protect } = require('../middleware/auth');
const { validate, tutorSchema } = require('../middleware/validate');
const tutorService = require('../services/tutor');
const Curriculum   = require('../models/Curriculum');
const User         = require('../models/User');

const router = express.Router();

// POST /api/tutor — main tutor action endpoint
router.post('/', protect, validate(tutorSchema), async (req, res) => {
  try {
    const { action, topic, code, language, context, question } = req.body;
    const user = req.user;

    let result;

    switch (action) {

      // Generate a full curriculum for a topic
      case 'curriculum': {
        const curriculum = await tutorService.generateCurriculum({ topic, language, user });

        // Save to DB
        const saved = await Curriculum.create({
          owner:       user._id,
          topic:       curriculum.topic,
          language:    curriculum.language,
          level:       curriculum.level,
          description: curriculum.description,
          capstone:    curriculum.capstone,
          steps:       curriculum.steps,
          totalSteps:  curriculum.steps.length,
        });

        // Set as user's active curriculum
        await User.findByIdAndUpdate(user._id, { 'tutor.activeCurriculum': saved._id });

        result = { curriculum: saved };
        break;
      }

      // Explain the current step / a concept
      case 'explain': {
        const explanation = await tutorService.explainConcept({ topic, code, language, question });
        result = { explanation };
        break;
      }

      // Give a hint without giving away the full answer
      case 'hint': {
        const hint = await tutorService.getHint({ code, language, context, question });
        result = { hint };
        break;
      }

      // Review user's submitted code against expected outcome
      case 'review': {
        const review = await tutorService.reviewCode({ code, language, context });
        result = { review };
        break;
      }

      // Advance to next step and get its explanation
      case 'next_step': {
        const { curriculumId } = context;
        const curriculum = await Curriculum.findOne({ _id: curriculumId, owner: user._id });
        if (!curriculum) return res.status(404).json({ error: 'Curriculum not found.' });

        // Mark current step complete
        if (curriculum.steps[curriculum.currentStep]) {
          curriculum.steps[curriculum.currentStep].completed   = true;
          curriculum.steps[curriculum.currentStep].completedAt = new Date();
          curriculum.completedSteps += 1;
        }

        curriculum.currentStep += 1;

        // Award XP
        await User.findByIdAndUpdate(user._id, { $inc: { 'tutor.xp': 50 } });

        // Check if curriculum complete
        if (curriculum.currentStep >= curriculum.totalSteps) {
          curriculum.status = 'completed';
          await curriculum.save();
          result = { completed: true, curriculum };
          break;
        }

        const nextStep   = curriculum.steps[curriculum.currentStep];
        const stepDetail = await tutorService.expandStep({ step: nextStep, language: curriculum.language });
        nextStep.explanation = stepDetail.explanation;
        nextStep.starterCode = stepDetail.starterCode;

        await curriculum.save();
        result = { curriculum, currentStep: nextStep };
        break;
      }

      default:
        return res.status(400).json({ error: 'Unknown tutor action.' });
    }

    res.json(result);
  } catch (err) {
    console.error('Tutor error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tutor/curricula — user's curricula
router.get('/curricula', protect, async (req, res) => {
  try {
    const curricula = await Curriculum.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json({ curricula });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tutor/curricula/:id
router.get('/curricula/:id', protect, async (req, res) => {
  try {
    const curriculum = await Curriculum.findOne({ _id: req.params.id, owner: req.user._id });
    if (!curriculum) return res.status(404).json({ error: 'Curriculum not found.' });
    res.json({ curriculum });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
