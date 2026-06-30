const express  = require('express');
const crypto   = require('crypto');
const Snippet  = require('../models/Snippet');
const { protect, optionalAuth }       = require('../middleware/auth');
const { validate, snippetSchema }     = require('../middleware/validate');

const router = express.Router();

// GET /api/snippets — user's own snippets
router.get('/', protect, async (req, res) => {
  try {
    const snippets = await Snippet.find({ owner: req.user._id })
      .sort({ createdAt: -1 })
      .select('-htmlCode -cssCode -jsCode -code'); // list view — no full code
    res.json({ snippets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/snippets/public — community snippets
router.get('/public', async (req, res) => {
  try {
    const { tag, lang, page = 1 } = req.query;
    const filter = { isPublic: true };
    if (tag)  filter.tags     = tag;
    if (lang) filter.language = lang;

    const snippets = await Snippet.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * 20)
      .limit(20)
      .populate('owner', 'name avatar')
      .select('-htmlCode -cssCode -jsCode -code');

    res.json({ snippets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/snippets/share/:shareId — shared snippet by link
router.get('/share/:shareId', async (req, res) => {
  try {
    const snippet = await Snippet.findOne({ shareId: req.params.shareId })
      .populate('owner', 'name avatar');
    if (!snippet) return res.status(404).json({ error: 'Snippet not found.' });
    snippet.views += 1;
    await snippet.save();
    res.json({ snippet });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/snippets/:id — single snippet (owner or public)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const snippet = await Snippet.findById(req.params.id).populate('owner', 'name avatar');
    if (!snippet) return res.status(404).json({ error: 'Snippet not found.' });

    const isOwner = req.user && snippet.owner._id.equals(req.user._id);
    if (!snippet.isPublic && !isOwner) {
      return res.status(403).json({ error: 'This snippet is private.' });
    }

    res.json({ snippet });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/snippets — create
router.post('/', protect, validate(snippetSchema), async (req, res) => {
  try {
    const snippet = await Snippet.create({ ...req.body, owner: req.user._id });
    res.status(201).json({ snippet });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/snippets/:id — update
router.put('/:id', protect, async (req, res) => {
  try {
    const snippet = await Snippet.findOne({ _id: req.params.id, owner: req.user._id });
    if (!snippet) return res.status(404).json({ error: 'Snippet not found.' });

    Object.assign(snippet, req.body);
    await snippet.save();
    res.json({ snippet });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/snippets/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const snippet = await Snippet.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!snippet) return res.status(404).json({ error: 'Snippet not found.' });
    res.json({ message: 'Snippet deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/snippets/:id/share — generate share link
router.post('/:id/share', protect, async (req, res) => {
  try {
    const snippet = await Snippet.findOne({ _id: req.params.id, owner: req.user._id });
    if (!snippet) return res.status(404).json({ error: 'Snippet not found.' });

    if (!snippet.shareId) {
      snippet.shareId = crypto.randomBytes(8).toString('hex');
      await snippet.save();
    }

    res.json({ shareId: snippet.shareId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/snippets/:id/fork
router.post('/:id/fork', protect, async (req, res) => {
  try {
    const original = await Snippet.findById(req.params.id);
    if (!original || (!original.isPublic && !original.owner.equals(req.user._id))) {
      return res.status(404).json({ error: 'Snippet not found.' });
    }

    const forked = await Snippet.create({
      title:    `Fork of ${original.title}`,
      language: original.language,
      code:     original.code,
      htmlCode: original.htmlCode,
      cssCode:  original.cssCode,
      jsCode:   original.jsCode,
      tags:     original.tags,
      isPublic: false,
      owner:    req.user._id,
    });

    original.forks += 1;
    await original.save();

    res.status(201).json({ snippet: forked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
