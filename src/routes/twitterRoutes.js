'use strict'

var express = require("express")
var TwitterController = require("../controllers/twitterController")
var md_auth = require("../middlewares/authenticated")

//SOLO UNA RUTA
var api = express.Router()
api.post('/commands', md_auth.ensureAuth, TwitterController.commands);

module.exports = api;
