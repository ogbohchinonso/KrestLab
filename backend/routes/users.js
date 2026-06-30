const express = require('express');
const User    = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('tutor.activeCurriculum', 'topic language currentStep totalSteps status');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, avatar },
      { new: true, runValidators: true }
    );
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/password
router.put('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }
    if (newPassword.length < 8) {
      return res.status(422).json({ error: 'New password must be at least 8 characters.' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
