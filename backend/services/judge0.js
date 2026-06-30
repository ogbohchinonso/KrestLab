const axios = require('axios');
const { LANGUAGES } = require('../config/languages');

const JUDGE0_URL   = process.env.JUDGE0_URL || 'http://localhost:2358';
const AUTH_TOKEN   = process.env.JUDGE0_AUTH_TOKEN || '';
const POLL_DELAY   = 800;   // ms between status polls
const MAX_POLLS    = 10;

const headers = {
  'Content-Type':  'application/json',
  'X-Auth-Token':  AUTH_TOKEN,
};

/**
 * Submit code to Judge0 and return the execution result.
 * @param {object} opts
 * @param {string} opts.language  - Language key (e.g. 'python')
 * @param {string} opts.code      - Source code
 * @param {string} opts.stdin     - Standard input (optional)
 */
async function run({ language, code, stdin = '' }) {
  const lang = LANGUAGES[language.toLowerCase()];
  if (!lang) throw new Error(`Unsupported language: ${language}`);

  // 1. Create submission
  const submitRes = await axios.post(
    `${JUDGE0_URL}/submissions?base64_encoded=false&wait=false`,
    {
      source_code:  code,
      language_id:  lang.id,
      stdin:        stdin,
      cpu_time_limit:    5,   // seconds
      memory_limit:      262144, // 256 MB
    },
    { headers }
  );

  const token = submitRes.data.token;
  if (!token) throw new Error('Judge0 did not return a submission token.');

  // 2. Poll for result
  for (let i = 0; i < MAX_POLLS; i++) {
    await _sleep(POLL_DELAY);

    const pollRes = await axios.get(
      `${JUDGE0_URL}/submissions/${token}?base64_encoded=false`,
      { headers }
    );

    const sub = pollRes.data;

    // Status IDs: 1=In Queue, 2=Processing, 3=Accepted, 4+=Error
    if (sub.status.id <= 2) continue;

    return _formatResult(sub);
  }

  throw new Error('Execution timed out waiting for Judge0 result.');
}

function _formatResult(sub) {
  const statusId = sub.status.id;

  return {
    stdout:      sub.stdout     || '',
    stderr:      sub.stderr     || '',
    compile_output: sub.compile_output || '',
    message:     sub.message    || '',
    status:      sub.status.description,
    statusId,
    time:        sub.time       || null,
    memory:      sub.memory     || null,
    // Normalised output: what the console should show
    output: _pickOutput(sub),
    success: statusId === 3,
  };
}

function _pickOutput(sub) {
  if (sub.compile_output) return `[Compile Error]\n${sub.compile_output}`;
  if (sub.stderr)         return `[Runtime Error]\n${sub.stderr}`;
  if (sub.message)        return `[${sub.status.description}]\n${sub.message}`;
  return sub.stdout || '(no output)';
}

function _sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { run };
