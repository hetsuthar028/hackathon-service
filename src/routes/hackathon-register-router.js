const express = require("express");
const requireLogin = require("../middlewares/require-login");
const validateDev = require('../middlewares/validate-dev');
const dbObj = require("../utils/database-obj");
const { v4: uuid4 } = require("uuid");
const async = require('async');

const hackathonRegisterRouter = express.Router();

let path = {
    registerForHackathon: "/api/hackathon/register/:hackathonID"
};

// @POST Route - Register for a Hackathon
hackathonRegisterRouter.post(`${path["registerForHackathon"]}`, (req, res)=>{
    // console.log("C User", req.currentUser)
    // console.log("Valid Dev", req.validDev)

    // @WORKAROUND
    // [Because we've remove requireLogin, validateDev middlewares from the above request]
    // [Solution: Solve for can't send headers after they're sent. This error is created by the requireLogin middleware]
    req.currentUser = {
        email: 'hetmewada0028@gmail.com', username: 'Het Suthar', userType: 'developer'
    }
    req.validDev = true
    
    async.auto({
        validate_user: function(callback){
            try{
                if(req.currentUser){
                    callback(null, 'valid');
                } else {
                    return callback('Not Authenticated', null)
                }
            } catch(err){
                return callback('Not Authenticated', null)
            }
        },

        authorize_user: [
            "validate_user",
            function(result, callback){
                try{
                    if(req.validDev){
                        callback(null, 'authorized')
                    } else{
                        return callback('Not Authorized', null)
                    }
                } catch(err){
                    return callback('Not Authorized', null)
                }
            }
        ],

        check_existing_hackathon: [
            "authorize_user",
            function(result, callback){
                let hackathonID = req.params.hackathonID;
                let hackathonExistsQuery = `SELECT id, maxParticipants, participantCount FROM hackathon WHERE id='${hackathonID}'`
                console.log("Hackathon ID", hackathonID);
                dbObj.query(hackathonExistsQuery, (err, results) => {
                    if(err){
                        console.log("Error checking existing hackathon", err);
                        return callback('Error fetching hackathon', null)
                    }

                    if(results && results.length !=0){
                        callback(null, {message: 'exists', data: results})
                    }
                    else {
                        return callback('Hackathon doesn\'t exists', null)
                    }
                })
            }
        ],

        already_registered_db: [
            "check_existing_hackathon",
            function(result, callback){
                let hackathonID = req.params.hackathonID;
                let alreadyRegisteredQuery = `SELECT userEmail FROM registration WHERE userEmail='${req.currentUser.email}' and hackathonID='${hackathonID}'`;

                dbObj.query(alreadyRegisteredQuery, (err, results) => {
                    if(err){
                        return callback('Error fetching user', null)
                    }
                    if(results && results.length !=0){
                        return callback('Already registered', null)
                    } else{
                        callback(null, 'valid')
                    }
                })

            }
        ],

        validate_update_participant_count: [
            "already_registered_db",
            function(result, callback){
                console.log("Up Data", result)
                let {id, maxParticipants, participantCount} = result.check_existing_hackathon.data[0];

                if(participantCount + 1 > maxParticipants){
                    return callback('Participant limit exceeded', null)
                } else {
                    let updateParticipantQuery = `UPDATE hackathon SET participantCount = participantCount + 1 WHERE id='${req.params.hackathonID}'`;
                    dbObj.query(updateParticipantQuery, (err, results) => {
                        if(err){
                            console.log("Error updating participant count")
                            return callback('Error updating participant count', null)
                        }
                        callback(null, 'count updated')
                    })
                }
            }
        ],

        register_user_db: [
            "validate_update_participant_count",
            function(result, callback){
                let uniqueRegID = uuid4();
                console.log("Hacakthon ID", req.params.hackathonID)
                let registerUserQuery = `INSERT INTO registration(id, userEmail, hackathonID) VALUES('${uniqueRegID}', '${req.currentUser.email}', '${req.params.hackathonID}')`;

                dbObj.query(registerUserQuery, (err, results) => {
                    if(err){
                        console.log("Error adding user to registration table", err)
                        return callback('Error registering user', null)
                    }
                    callback(null, 'registered successfully')
                })
            }
        ],

        

    }).then((results) => {
        console.log("Results = ", results);
        return res.json(results)
    }).catch((err) => {
        console.log("Errors =", err);
        return res.status(500).send(err);
    })

    // if(req.currentUser){
    //     if(req.validDev == true){
    //         let hackathonID = req.params.hackathonID;
    //         if(hackathonID){
    //             let hackathonExistsQuery = `SELECT id FROM hackathon WHERE id='${hackathonID}'`
    //             dbObj.query(hackathonExistsQuery, (err, results)=>{
    //                 if(err){
    //                     return console.log("Error getting Hackathon");
    //                 }
    //                 console.log("Results", results)
    //                 if(results && results.length !=0){                
    //                     let uniqueRegID = uuid4();
    //                     let registrationQuery = `INSERT INTO registration(id, userEmail, hackathonID) VALUES('${uniqueRegID}', '${req.currentUser.email}', '${hackathonID}')`;
    //                     dbObj.query(registrationQuery, (err, results)=>{
    //                         if(err){
    //                             return res.status(200).send({message: "already registered"})
    //                             // return console.log("You're already registered for a Hackathon");
    //                         }
    //                         console.log("Registered")
    //                         // @Query - Participant Count Update
    //                         let updateParticipantQuery = `UPDATE hackathon SET participantCount = participantCount + 1 WHERE id='${hackathonID}'`;
    //                         dbObj.query(updateParticipantQuery, (err, result)=>{
    //                             if(err){
    //                                 return console.log("Error updating Participant Count");
    //                             }
    //                             return console.log("Participant Count updated")
    //                         })                        

    //                         return res.status(200).send({message: "registered succesfully"})
    //                         // return console.log("You're registered for the hackathon");
    //                     })
    //                 }
    //             })
    //         } 
    //     } else {
    //         return res.status(401).json({message: "Not Authorized"});
    //     }
    // } else{
    //     return res.status(401).json({message: "Not Authenticated"})
    // }
})

module.exports = hackathonRegisterRouter;
