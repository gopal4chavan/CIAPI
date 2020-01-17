const User = require("../models/index").User;
const bcrypt = require('bcryptjs');


function validateUserDetails(req, res, next){
  const Joi = require('joi');
      
  // fetch the request data
  const data = req.body;

  // define the validation schema
  const schema = Joi.object().keys({
      firstname: Joi.string().required().error(new Error('FirstName is required')),
      lastname: Joi.string().required().error(new Error("LastName is required")),
      email: Joi.string().email().required().error(new Error("Invalid Email")),
      password: Joi.string().required().min(4).error(new Error("Password should be minimum 4 characters"))
  });

  Joi.validate(data, schema, (err, value) => {
    if (err) {
        // send a 422 error response if validation fails
        res.status(422).json({
            status: 'error',
            message: err.message,
            data: data
        });
        // next({status: 422, message: err.message, data: data})
    }else{
      next();
    }
  });
}


function validatePassword(req, res, next){
  let passwordIsValid = bcrypt.compareSync(req.body.password, req.user.password);
  if (!passwordIsValid){
      next({ auth: false, token: null, message: 'Invalid Password' });   
  }
  next();
}




// TODO: Need to move below two function to users.js file for simplicity

async function newUser(req, res, next){
  try{
      req.user = await User.create({
          firstname: req.body.firstname,
          lastname: req.body.lastname,
          email: req.body.email,
          password: bcrypt.hashSync(req.body.password, 8),
      })
      next();
  }catch(e){
      res.status(500).send({message: e.message})
      // next(e.message);
  }
}

async function findUser(req, res, next){
  try{
    let user = await User.findOne({
      where: {email: req.body.email}
    });
    if(!user){
      // next({message: 'Invalid Email'});
      res.status(400).send("Invalid Email");
    }
    req.user = user;
    next();
  }catch(e){
    // next(e.message);
    res.status(500).send("Something went wrong");
  }
}


module.exports = {
  findUser: findUser,
  newUser: newUser,
  validatePassword: validatePassword,
  validateUserDetails: validateUserDetails
}




    // validateUserDetails: function(req, res, next){
    //   const Joi = require('joi');
      
    //   // fetch the request data
    //   const data = req.body;

    //   // define the validation schema
    //   const schema = Joi.object().keys({
    //       firstname: Joi.string().required().error(new Error('FirstName is required')),
    //       lastname: Joi.string().required().error(new Error("LastName is required")),
    //       email: Joi.string().email().required().error(new Error("Invalid Email")),
    //       password: Joi.string().required().min(4).error(new Error("Password should be minimum 4 characters"))
    //   });

    //   Joi.validate(data, schema, (err, value) => {
    //     if (err) {
    //         // send a 422 error response if validation fails
    //         res.status(422).json({
    //             status: 'error',
    //             message: err.message,
    //             data: data
    //         });
    //         // next({status: 422, message: err.message, data: data})
    //     }else{
    //       next();
    //     }
    //   });
    // },

    // newUser: async function(req, res, next){
    //     try{
    //         req.user = await User.create({
    //             firstname: req.body.firstname,
    //             lastname: req.body.lastname,
    //             email: req.body.email,
    //             password: bcrypt.hashSync(req.body.password, 8),
    //         })
    //         next();
    //     }catch(e){
    //         res.status(500).send({message: e.message})
    //         // next(e.message);
    //     }
    // },

    // validatePassword: function(req, res, next){
    //     let passwordIsValid = bcrypt.compareSync(req.body.password, req.user.password);
    //     if (!passwordIsValid){
    //         next({ auth: false, token: null, message: 'Invalid Password' });   
    //     }
    //     next();
    // },
    
    // findUser: async function(req, res, next){
    //   try{
    //     let user = await User.findOne({
    //       where: {email: req.body.email}
    //     });
    //     if(!user){
    //       // next({message: 'Invalid Email'});
    //       res.status(400).send("Invalid Email");
    //     }
    //     req.user = user;
    //     next();
    //   }catch(e){
    //     // next(e.message);
    //     res.status(500).send("Something went wrong");
    //   }
    // }






















// existingEmail: async function(req, res, next){
    //     try{
    //         let existingUser = await User.findOne({email: req.body.email})
    //         if(existingUser){
    //             return res.status(200).send("User already exists with the email ID");
    //         }
    //     } catch(e){
    //         res.status(500).send(e.message);
    //     }
    //     next();
    // },