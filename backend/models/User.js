const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type:     String,
    required: true,
    trim:     true,
    maxlength: 50,
  },
  email: {
    type:     String,
    required: true,
    unique:   true,
    lowercase: true,
    trim:     true,
  },
  password: {
    type:     String,
    required: true,
    minlength: 8,
  },
  avatar: {
    type:    String,
    default: '',
  },
  role: {
    type:    String,
    enum:    ['user', 'admin'],
    default: 'user',
  },
  // AI tutor state
  tutor: {
    activeCurriculum: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'Curriculum',
      default: null,
    },
    completedCurricula: [{
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Curriculum',
    }],
    xp:    { type: Number, default: 0 },
    level: { type: Number, default: 1 },
  },
  // Execution quota tracking (for future monetization)
  usage: {
    executions: { type: Number, default: 0 },
    resetAt:    { type: Date,   default: () => new Date(Date.now() + 86400000) },
  },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Strip password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
