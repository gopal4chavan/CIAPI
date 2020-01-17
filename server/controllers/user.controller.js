const User = require("../models/index").User;

module.exports = {
  create: function(req, res){
    res.status(201).send({user: req.user, token: req.token});
  },

  login: function(req, res){
    res.status(200).send({token: req.token});
  },
  userDet: async function(req, res){
    try{
      let user = await User.findById(req.userId);
      res.status(200).send({user: user});
    }catch(e){
      res.status(500).send({"message": e.message});
    }
  }
}