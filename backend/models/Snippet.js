const mongoose = require('mongoose');

const snippetSchema = new mongoose.Schema({
  title:    { type: String, required: true, trim: true, maxlength: 100 },
  language: { type: String, required: true },
  code:     { type: String, required: true },

  // For HTML/CSS/JS multi-buffer saves
  htmlCode: { type: String, default: '' },
  cssCode:  { type: String, default: '' },
  jsCode:   { type: String, default: '' },

  isPublic: { type: Boolean, default: false },
  tags:     [{ type: String, maxlength: 30 }],

  owner: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
  },

  // Share link — generated on demand
  shareId: {
    type:   String,
    unique:  true,
    sparse:  true,
    default: null,
  },

  views: { type: Number, default: 0 },
  forks: { type: Number, default: 0 },

}, { timestamps: true });

// Index for fast user snippet listing and public browsing
snippetSchema.index({ owner: 1, createdAt: -1 });
snippetSchema.index({ isPublic: 1, createdAt: -1 });
snippetSchema.index({ shareId: 1 });

module.exports = mongoose.model('Snippet', snippetSchema);
