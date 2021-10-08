const express = require("express");
const requireLogin = require("../middlewares/require-login");
const validateDev = require('../middlewares/validate-dev');
const dbObj = require("../utils/database-obj");
const { v4: uuid4 } = require("uuid");

const hackathonRegisterRouter = express.Router();

let path = {
    registerForHackathon: "/api/hackathon/register/:hackathonID"
};

// @POST Route - Register for a Hackathon
hackathonRegisterRouter.post(`${path["registerForHackathon"]}`, requireLogin, validateDev, (req, res)=>{
    // console.log("C User", req.currentUser)
    // console.log("Valid Dev", req.validDev)
    if(req.currentUser && req.validDev == true){
        let hackathonID = req.params.hackathonID;
        if(hackathonID){
            let hackathonExistsQuery = `SELECT id FROM hackathon WHERE id='${hackathonID}'`
            dbObj.query(hackathonExistsQuery, (err, results)=>{
                if(err){
                    return console.log("Error getting Hackathon");
                }
                console.log("Results", results)
                if(results && results.length !=0){                
                    let uniqueRegID = uuid4();
                    let registrationQuery = `INSERT INTO registration(id, userEmail, hackathonID) VALUES('${uniqueRegID}', '${req.currentUser.email}', '${hackathonID}')`;
                    dbObj.query(registrationQuery, (err, results)=>{
                        if(err){
                            return console.log("You're already registered for a Hackathon");
                        }
                        
                        // @Query - Participant Count Update
                        let updateParticipantQuery = `UPDATE hackathon SET participantCount = participantCount + 1 WHERE id='${hackathonID}'`;
                        dbObj.query(updateParticipantQuery, (err, result)=>{
                            if(err){
                                return console.log("Error updating Participant Count");
                            }
                            return console.log("Participant Count updated")
                        })                        

                        return console.log("You're registered for the hackathon");
                    })
                }
            })
        }
    } else{
        return res.status(401).json({message: "Not Authorized"});
    }
})

module.exports = hackathonRegisterRouter;
