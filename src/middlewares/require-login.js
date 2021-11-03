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
    // return res.status(400).send({message: "User not validated"})



    // if(req.headers){
    //     let authToken = req.headers.authorization;
        
    //     if(authToken){
    //         axios.get('http://localhost:4200/api/user/giveJWT', {
    //             headers: {
    //                 sharedJWT : process.env.JWT_SECRET_BW_SERVICES
    //             }
    //         }).then(response=>{
    //             if(response){
    //                 console.log("Shared with Hackathon by User Service". response.headers.sharedJWT);
    //                 try{
    //                     const decoded = jwt.verify(authToken, response.headers.sharedJWT)
    //                     if(decoded){
    //                         next();
    //                     }
    //                 }
    //                 catch(err){
    //                     // 
    //                 }
                    
    //             }
    //         }).catch(err=>{
    //             return next();
    //         })
    //     }
    // }

    // next();
};

module.exports = requireLogin;