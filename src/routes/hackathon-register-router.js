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

    // @WORKAROUND
    // [Because we've remove requireLogin, validateDev middlewares from the above request]
    // [Solution: Solve for can't send headers after they're sent. This error is created by the requireLogin middleware]
    // req.currentUser = {
    //     email: 'hetmewada0028@gmail.com', username: 'Het Suthar', userType: 'developer'
    // }
    // req.validDev = true

    let {currentUser} = req.body;
    
    async.auto({
        check_existing_hackathon: 
            function(callback){
                let hackathonID = req.params.hackathonID;
                let hackathonExistsQuery = `SELECT id, maxParticipants, participantCount, regEnd FROM hackathon WHERE id='${hackathonID}'`
                console.log("Hackathon ID", hackathonID);
                dbObj.query(hackathonExistsQuery, (err, results) => {
                    if(err){
                        console.log("Error checking existing hackathon", err);
                        return callback('Error fetching hackathon', null)
                    }

                    if(results && results.length !=0){
                        let currentDate = new Date().toISOString();
                        console.log("RESULTS at 0", results[0])
                        let registerEndDate = new Date(results[0].regEnd).toISOString();
                        console.log("Dates 123", currentDate, registerEndDate)
                        if(currentDate >= registerEndDate){
                            callback('Registrations are ended!', null);
                        } else{
                            callback(null, {message: 'exists', data: results})
                        }
                    }
                    else {
                        return callback('Hackathon doesn\'t exists', null)
                    }
                })
            }
        ,

        already_registered_db: [
            "check_existing_hackathon",
            function(result, callback){
                let hackathonID = req.params.hackathonID;
                
                let alreadyRegisteredQuery = `SELECT userEmail FROM registration WHERE userEmail='${currentUser.email}' and hackathonID='${hackathonID}'`;

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
                let registerUserQuery = `INSERT INTO registration(id, userEmail, hackathonID) VALUES('${uniqueRegID}', '${currentUser.email}', '${req.params.hackathonID}')`;

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
})

module.exports = hackathonRegisterRouter;
