const axios = require("axios");

const validateOrg = (req, res, next) => {
    if (req.currentUser && req.currentUser != undefined) {
        let currentUser = req.currentUser;
        console.log("Client Header", currentUser);
        if (currentUser.userType == "organization") {
            req.validOrg = true;
            next();
        } else {
            req.validOrg = false;
            next();
        }
    }
    req.validOrg = false;
    next();
};

module.exports = validateOrg;
