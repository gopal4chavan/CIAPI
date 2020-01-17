const jwt = require('jsonwebtoken');
const secrets = {secretKey:'test',tokenExpiryTime: 24*60*60};

exports.authenticateUser = async function(req, res, next){
    
    let token = req.headers['x-access-token'] || req.query.token || req.cookies["access-token"];
    if (!token){
        // return res.status(401).send({ auth: false, message: 'No token provided.' });
        next({ message: 'No token provided.' });
    }
    try{
        let decoded = await jwt.verify(token, secrets.secretKey)
        res.cookie('access-token', token);
        req.userId = decoded.id
    }catch(e){
        if(e.name == 'TokenExpiredError'){
            res.status(401).send({ auth: false, message: 'Invalid Token, Authentication Failed' });
        }
        return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
    }
    next()
}

exports.generateToken = function(req, res, next){
    req.token = jwt.sign({ id: req.user.id, email: req.user.email, name: (req.user.firstname+req.user.lastname) }, secrets.secretKey, {
        expiresIn: secrets.tokenExpiryTime // expires in 24 hours
    });
    next();
}

