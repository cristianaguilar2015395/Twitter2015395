'use strict'

var jwt = require("jwt-simple")
var moment = require("moment")
var secret = 'clave_secreta_Twitter2015395'

exports.ensureAuth = function(req, res, next){
    var params = req.body;
    var arrUserData = Object.values(params);
    var valor = arrUserData.toString().split(" ");

    if (!req.headers.authorization) {
        if (valor[0] === 'register') {
            next();
        } else if (valor[0] === 'login') {
            next();
        } else {
            return res.status(500).send({ message: 'Error, debes loguarte antes para acceder' });
        }
    } else {
        var token = req.headers.authorization.replace(/["']+/g, '');
        try {
            var payload = jwt.decode(token, secret, true);
            console.log(payload);
            var idUser = payload.sub;
            module.exports.idUser = idUser;
            if (payload.exp <= moment().unix()) {
                return res.status(401).send({ message: 'Token expirado' });
            }
        } catch (ex) {
            return res.status(404).send({ message: 'El token no es válido' });
        }
        req.user = payload;
        next();
    }
}