const express    = require('express');
const { protect, optionalAuth } = require('../middleware/auth');
const { validate, executeSchema } = require('../middleware/validate');
const judge0     = require('../services/judge0');

const router = express.Router();

// POST /api/execute
// All languages free — auth optional (for usage tracking later)
router.post('/', optionalAuth, validate(executeSchema), async (req, res) => {
  try {
    const { language, code, stdin } = req.body;

    // HTML/CSS/JS runs client-side; this endpoint handles compiled/interpreted langs
    if (language === 'html') {
      return res.status(400).json({
        error: 'HTML/CSS/JS runs in the browser directly. No server execution needed.',
      });
    }

    const result = await judge0.run({ language, code, stdin });

    // Increment usage counter if user is logged in
    if (req.user) {
      req.user.usage.executions += 1;
      await req.user.save();
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
