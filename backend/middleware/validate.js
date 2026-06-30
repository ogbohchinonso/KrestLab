const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map((d) => d.message).join(', ');
    return res.status(422).json({ error: messages });
  }
  next();
};

// ── Schemas ───────────────────────────────────────────────────────────────────

const registerSchema = Joi.object({
  name:     Joi.string().min(2).max(50).required(),
  email:    Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required(),
});

const snippetSchema = Joi.object({
  title:    Joi.string().min(1).max(100).required(),
  language: Joi.string().required(),
  code:     Joi.string().max(100000).required(),
  isPublic: Joi.boolean().default(false),
  tags:     Joi.array().items(Joi.string().max(30)).max(10).default([]),
  // HTML/CSS/JS multi-buffer fields
  htmlCode: Joi.string().max(100000).allow(''),
  cssCode:  Joi.string().max(100000).allow(''),
  jsCode:   Joi.string().max(100000).allow(''),
});

const executeSchema = Joi.object({
  language:  Joi.string().required(),
  code:      Joi.string().max(100000).required(),
  stdin:     Joi.string().max(10000).allow('').default(''),
});

const tutorSchema = Joi.object({
  action:      Joi.string().valid('curriculum', 'explain', 'hint', 'review', 'next_step').required(),
  topic:       Joi.string().max(200).allow(''),
  code:        Joi.string().max(100000).allow(''),
  language:    Joi.string().allow(''),
  context:     Joi.object().default({}),
  question:    Joi.string().max(1000).allow(''),
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  snippetSchema,
  executeSchema,
  tutorSchema,
};
