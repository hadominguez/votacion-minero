const errorHandler = (error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ mensaje: 'Error interno del servidor.' });
};

module.exports = errorHandler;
