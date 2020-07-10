'use strict'

var User = require('../models/user');
var Tweet = require('../models/twitter');
var bcrypt = require('bcrypt-nodejs');
var jwt = require('../services/jwt');
var auth = require('../middlewares/authenticated');

function commands(req, res) {
    var user = new User();
    var tweet = new Tweet();
    var params = req.body;
    var userData = Object.values(params); 
    var valor = userData.toString().split(" ");

        if (valor[0] == 'register') {
            if (valor[1] != null && valor[2] != null && valor[3] != null && valor[4] != null) {
                User.findOne({ $or: [{ email: valor[2] }, { username: valor[3] }] }, (err, userFind) => {
                    if (err) {
                        return res.status(500).send({ message: 'Error en la peticion de usuario' })
                    } else if (userFind) {
                        return res.status(500).send({ message: 'El usuario o correo ya existe' })
                    } else {
                        user.name = valor[1];
                        user.email = valor[2];
                        user.username = valor[3];
                        user.password = valor[4];

                        bcrypt.hash(valor[4], null, null, (err, hash) => {
                            if (err) {
                                return res.status(500).send({ message: 'No se ha podido encriptar' })
                            } else {
                                user.password = hash;

                                user.save((err, userGuardado) => {
                                    if (err) {
                                        return res.status(500).send({ message: 'Error al guardar el usuario' })
                                    } else if (userGuardado) {
                                        res.send({ user: userGuardado })
                                    } else {
                                        return res.status(404).send({ message: 'No se ha podido registrar el usuario' })
                                    }
                                })
                            }
                        })
                    }
                })
            } else {
                return res.status(200).send({ message: 'Rellene todos los datos necesarios' })
            }
        }


        if (valor[0] == 'login') {
            if (valor[1] != null && valor[2] != null) {
                User.findOne({ $or: [{ username: valor[1] }, { email: valor[1] }] }, (err, userFind) => {
                    if (err) {
                        return res.status(500).send({ message: 'Error en la peticion de usuario' })
                    } else if (userFind) {
                        bcrypt.compare(valor[2], userFind.password, (err, check) => {
                            if (err) {
                                return res.status(500).send({ message: 'Error al loguear' })
                            } else if (check) {
                                if (valor[3] = 'true') {
                                    res.send({ token: jwt.createToken(userFind) })
                                } else {
                                    res.send({ user: userFind })
                                }
                            } else {
                                return res.status(404).send({ message: 'No se ha podido loguear, intente de nuevo' })
                            }
                        })
                    } else {
                        return res.status(404).send({ message: 'El usuario no existe' })
                    }
                })
            } else {
                return res.status(200).send({ message: 'Ingrese el usuario y la contraseña' })
            }
        }


        if (valor[0] == 'add_tweet') {
            if (valor[1] != null) {

                tweet.description = valor.join(' ');
                tweet.description = tweet.description.replace('add_tweet', '');
                tweet.description = tweet.description.replace(' ', '');

                tweet.save((err, tweetGuardado) => {
                    if (err) {
                        return res.status(500).send({ message: 'Error en la peticion' })
                    } else if (tweetGuardado) {
                        res.send({ tweet: tweetGuardado })
                    } else {
                        return res.status(404).send({ message: 'Error, el tweet no se ha podido publicar' })
                    }
                })
            } else {
                return res.status(200).send({ message: 'Tweet vacio. Ingrese la descripcion de su tweet'})
            }
        }

        if (valor[0] == 'delete_tweet') {
            if (valor[1] != null) {
                User.findByIdAndUpdate(req.user.sub, { $pull: { tweets: valor[1] } }, { new: true }, (err, tweetEliminado) => {
                    if (err) {
                        return res.status(500).send({ message: 'Error en la peticion' })
                    } else if (tweetEliminado) {
                        Tweet.findByIdAndRemove(valor[1], (err, tweetFind) => {
                            if (err) {
                                return res.status(500).send({ message: 'Error, no se ha podido completar la accion' })
                            } else if (tweetFind) {
                                res.send({ user: tweetEliminado })
                            } else {
                                return res.status(404).send({ message: 'Tweet no encontrado' })
                            }
                        })
                    } else {
                        return res.status(404).send({ message: 'No se ha podido eliminar el tweet' })
                    }
                })
            } else {
               return res.status(200).send({ message: 'Ingrese el ID del tweet a eliminar' })
            }
        }

        if (valor[0] == 'edit_tweet') {
            if (valor[1] != null) {
                if (valor[2] != null) {
                    tweet.description = valor.join(' ');
                    tweet.description = tweet.description.replace('edit_tweet', '');
                    tweet.description = tweet.description.replace(valor[1], '');
                    tweet.description = tweet.description.replace('  ', '');

                    var update = tweet.description;
                    
                    Tweet.findByIdAndUpdate(valor[1], { $set: { description: update } }, { new: true }, (err, tweetActualizado) => {
                        if (err) {
                            return res.status(500).send({ message: 'Error en la peticion' })
                        } else if (tweetActualizado) {
                            res.send({ tweet: tweetActualizado })
                        } else {
                            return res.status(404).send({ message: 'Error al actualizar el tweet' })
                        }
                    })
                } else {
                    return res.status(200).send({ message: 'Ingrese el contenido nuevo o editado en el tweet' })
                }
            } else {
                return res.status(200).send({ message: 'Ingrese el ID del tweet a editar' })
            }
        }

        if (valor[0] == 'view_tweets') {
            if (valor[1] != null) {
                User.findOne({ username: { $regex: valor[1], $options: 'i' } }, (err, userFind) => {
                    if (err) {
                        return res.status(500).send({ message: 'Error en la peticion' })
                    } else if (userFind) {
                        User.find({ username: valor[1] }, { tweets: 1, _id: 0 }, (err, tweets) => {
                            if (err) {
                                return res.status(500).send({ message: 'Error al realizar la accion' })
                            } else {
                                Tweet.populate(tweets, { path: "tweets" }, (err, tweets) => {
                                    if (err) {
                                        return res.status(500).send({ message: 'Error en la peticion del usuario' })
                                    } else if (tweets) {
                                        res.send({ user: valor[1], tweets })
                                    } else {
                                        return res.status(404).send({ message: 'No se han podido mostrar los tweets' })
                                    }
                                })
                            }
                        })
                    } else {
                        return res.status(404).send({ message: 'No se ha encontrado el usuario' })
                    }
                })
            } else {
                return res.status(200).send({ message: 'Ingrese un ID de usuario valido' })
            }
        }


        if (valor[0] == 'follow') {
            if (valor[1] != null) {
                User.findOne({ username: { $regex: valor[1], $options: 'i' } }, (err, userFind) => {
                    if (err) {
                        return res.status(500).send({ message: 'Error en la peticion' })
                    } else if (userFind) {
                        User.findOneAndUpdate({ username: valor[1] }, { $push: { followers: req.user.sub } }, { new: true }, (err, userSeguido) => {
                            if (err) {
                                return res.status(500).send({ message: 'Error al realizar la accion' })
                            } else if (userSeguido) {
                                res.send({ user: userSeguido })
                            } else {
                                return res.status(404).send({ message: 'No se ha podido seguir al usuario' })
                            }
                        })
                    } else {
                        return res.status(404).send({ message: 'Usuario no encontrado' })
                    }
                })
            } else {
                return res.status(200).send({ message: 'Ingrese el nombre de usuario a seguir' })
            }
        }


        if (valor[0] == 'unfollow') {
            if(valor[1] != null){
                User.findOne({username: {$regex: valor[1], $options: 'i'} }, (err, userFind)=>{
                    if(err){
                        return res.status(500).send({message: 'Error en la peticion'})
                    }else if(userFind){ 
                                User.findOneAndUpdate({username: valor[1]},{$pull:{followers: auth.idUser}}, {new:true}, (err, userUnfollow)=>{
                                    if(err){
                                        return res.status(500).send({message: 'Error al realizar la accion'})
                                    }else if(userUnfollow){
                                        return res.status(200).send({message: 'Has dejado de seguir a ' + valor[1]})
                                    }else{
                                        return res.status(404).send({message: 'No se puede dejar de seguir al usuario'})
                                    }
                                })
                    }else{
                        return res.status(404).send({message: 'Usuario no encontrado'});
                    }
                })
            }else{
              return res.status(200).send({message: 'Ingrese el nombre de usuario a dejar de seguir'});
            }
        }

        if (valor[0] == "profile") {
            var username = valor[1];
            User.find({$or: [{ username: { $regex: "^" + valor[1], $options: "i" }}],}, (err, userFind) => {
              if (err) {
                return res.status(404).send({ message: "No se ha encontrado el usuario", err })
              } else if (userFind) {
                res.send({ profile: "Perfil:", userFind })
              } else {
                return res.status(200).send({ message: "Ingrese su nombre de usuario" })
              }
            }
            )
          }
}


module.exports = {
    commands
}