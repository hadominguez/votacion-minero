const mongoose = require('mongoose');
const ConfigEnv = require('../../app/config');

const MONGODB_URI = `mongodb://${ConfigEnv.USERDB}:${ConfigEnv.PASSDB}@${ConfigEnv.HOTSDB}:${ConfigEnv.PORTDB}/${ConfigEnv.NAMEDB}`;

//const MONGODB_URI = 'mongodb://useradmin:p4ssw0rd2021@localhost/blockchain';

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(()=> console.log('Conectado a MongoDB')) 
.catch(e => console.log('Error de conexión', e))

module.exports = mongoose;