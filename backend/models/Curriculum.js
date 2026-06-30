const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema({
  index:       { type: Number, required: true },
  title:       { type: String, required: true },
  objective:   { type: String, required: true },
  explanation: { type: String, required: true },   // AI-generated lesson text
  starterCode: { type: String, default: '' },
  solution:    { type: String, default: '' },
  language:    { type: String, required: true },
  completed:   { type: Boolean, default: false },
  completedAt: { type: Date,    default: null },
}, { _id: false });

const curriculumSchema = new mongoose.Schema({
  owner: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
  },
  topic:       { type: String, required: true },
  language:    { type: String, required: true },
  level:       { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  description: { type: String },

  // Capstone project
  capstone: {
    title:       String,
    description: String,
    starterCode: String,
    solution:    String,
    completed:   { type: Boolean, default: false },
  },

  steps:          [stepSchema],
  currentStep:    { type: Number, default: 0 },
  totalSteps:     { type: Number, default: 0 },
  completedSteps: { type: Number, default: 0 },

  status: {
    type:    String,
    enum:    ['active', 'completed', 'paused'],
    default: 'active',
  },

}, { timestamps: true });

curriculumSchema.index({ owner: 1, status: 1 });

module.exports = mongoose.model('Curriculum', curriculumSchema);
