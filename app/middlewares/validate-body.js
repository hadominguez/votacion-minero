const validateBody = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ mensaje: 'Body inválido.', errores: parsed.error.issues });
  }
  req.body = parsed.data;
  return next();
};

module.exports = validateBody;
