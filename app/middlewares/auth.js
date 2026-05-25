const ConfigEnv = require('../config');

const checkAuth = (req, res, next) => {
  if (req.body.usuario === ConfigEnv.USER_API && req.body.contrasena === ConfigEnv.PASS_API) return next();
  return res.status(401).json({ mensaje: 'Usuario o contraseña inválido.' });
};

module.exports = checkAuth;
