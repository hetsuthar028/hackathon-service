const validateDev = (req, res, next) =>{
    if(req.currentUser && req.currentUsere != undefined){
        let currentUser = req.currentUser;

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