const validateDev = (req, res, next) =>{
    if(req.currentUser && req.currentUser != undefined){
        let currentUser = req.currentUser;
        // console.log("Client Header", currentUser)
        if(currentUser.userType == 'developer'){
            req.validDev = true;
            next();
        } else{
            req.validDev = false;
            next();
        }
    }
    req.validDev = false;
    next();
}

module.exports = validateDev;