require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');

const requireLogin = async (req, res, next) =>{
    let hdr = req.headers;
    
    if(hdr){
        if(hdr.authorization){
            console.log("HEADER AUTH", hdr.authorization)
            await axios.get('http://localhost:4200/api/user/currentuser', {
                headers: {
                    authorization: hdr.authorization
                }
            }).then(response=>{
                // console.log("Login", response.data)
                req.currentUser = response.data.currentUser;
                // console.log("C User", req.currentUser)
                next();
            }).catch(err=>{
                next();
                // return res.status(400).send({message: "User not validated"})
            })
        }
    }

    next();
};

module.exports = requireLogin;