const axios = require('axios');

const validateOrg = (req, res, next) =>{
    let {currentUser} = req.currentUser;
    // console.log("Client Header", currentUser);
    if(currentUser){
        if(currentUser.userType == 'organization'){
            req.validOrg = true
            next();
        } else{
            req.validOrg = false
            next();
        }
    } 
    req.validOrg = false
    next();
}

module.exports = validateOrg;