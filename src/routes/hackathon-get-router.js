const express = require('express')
const axious = require('axios')
const dbObj = require('../utils/database-obj');
const requireLogin = require('../middlewares/require-login');
const async = require('async');

const hackathonGetRouter = express.Router();

let path = {
    getUpcomingHackathons: "/api/hackathon/get/upcomingHackathons",
    getAllHackathons: "/api/hackathon/get/allHackathons",
    getSpecificHackathon: "/api/hackathon/get/id/:hackathonID",
    getPastHackathon: "/api/hackathon/get/pastHackathons",
    getHackathonSummary: "/api/hackathon/get/hackathonSummary/:hackathonID"
}

// Get Upcoming Hackathons - Async
hackathonGetRouter.get(
    `${path['getUpcomingHackathons']}`,
    // requireLogin,
    (req, res)=>{

        let date = new Date();
        let currentDate = date.toISOString().split('T')[0]

        // Async
        async.auto({

            // Removed for Testing Purpose

            // check_current_user: function(callback){
            //     if(!req.currentUser){
            //         callback('Invalid user', null)
            //         return;
            //     }
            //     callback(null, {message: 'valid', currentUser: req.currentUser})
            // },

            get_upcoming_hackathons: 
                
                // Removed these things for testing purpose
                // "check_current_user",
                // Add ["check_current_user", later on
                // Add result parameter to below function

                function(callback){
                    let getHackathonQuery = `SELECT * from hackathon WHERE hackStart >= ${currentDate}`;

                    dbObj.query(getHackathonQuery, (err, results)=>{
                        if(err){
                            callback('Error fetching Hackathons from DB', null)
                            return;
                        }

                        if(results && results.length == 0){
                            callback('No upcoming hackathons', null)
                            return;
                        } else{
                            callback(null, {message: 'valid', upcomingHackathons: results})
                        }
                    })
                }
            
        }).then(responses => {
            return res.send(responses);
        }).catch(err=>{
            return res.status(500).send(err);
        })

    }
)

// hackathonGetRouter.get(
//     `${path["getUpcomingHackathons"]}`,
//     requireLogin,
//     (req, res) => {
//         // console.log("Req Header", req.headers.authorization);
//         // console.log("Current User", req.currentUser);
//         let date = new Date();
//         let currentDate = date.toISOString().split('T')[0]
        
//         if (req.currentUser) {
//             let getHackathonQuery = `SELECT * from hackathon WHERE hackStart >= ${currentDate}`;
//             dbObj.query(getHackathonQuery, (err, results)=>{
//                 if(err){
//                     return res.status(400).send({error: "Can't fetch hackathon"})
//                 }
//                 if(results){
//                     console.log("\n**Hackathons**\n")
//                     console.log(results)
//                     // return res.send({message: results})
//                 }
//             })
//             return res.send({ message: "Here's are your hackathons." });
//         } else {
//             return res
//                 .status(401)
//                 .json({ message: "You're not authorized user." });
//         }
//     }
// );

// Get Specific Hackathon - Async
hackathonGetRouter.get(`${path['getSpecificHackathon']}`, (req, res)=>{
    
    // Temp Current User [Because we've removed "requireLogin" middleware from above request]
    req.currentUser = {
        email : "hetmewada0028@gmail.com"
    }
    async.auto({
        check_current_user : function(callback){
            if(!req.currentUser){
                callback('Invalid user', null)
                return;    
            }
            callback(null, {currentUser: req.currentUser, message: "Valid user"})
        },

        get_hackathon_db: ["check_current_user", function(result, callback){
            let hackathonID = req.params.hackathonID;
            let hackathonExistsQuery = `SELECT * FROM hackathon WHERE id='${hackathonID}'`;
            
            dbObj.query(hackathonExistsQuery, (err, results)=>{
                if(err){
                    console.log("ERror fetching HACK")
                   callback('Error fetching hackathon from DB', null) 
                   return;
                }
                if(results && results.length == 0){
                    console.log("No Hack")
                    callback('Hackathon doesn\'t exists!', null)
                    return;
                }
                else {
                    console.log("Valid SEnd HACK")
                    callback(null, {message: 'valid', hackathon: results[0]})
                }
            })
        }],

        get_problem_statements_db: [
            "get_hackathon_db",
            function(result, callback){
                
                let hackathonID = result.get_hackathon_db.hackathon.id;
                let getProblemStatementsQuery = `SELECT * FROM problemStatement WHERE hackathonID='${hackathonID}'`;

                dbObj.query(getProblemStatementsQuery, (err, results)=>{
                    if(err){
                        console.log("ERror fetching Prob")
                        callback('Error fetching Problem Statements from DB', null)
                        return;
                    }
                    if(results && results.length !=0){
                        console.log("Valid send prob")
                        callback(null, {message: 'valid', problemStatements: results})
                    }
                })
            }
        ]
    }).then(responses => {
        console.log("Sent")
        console.log(responses)
        return res.json(responses);
    }).catch(err=>{
        console.log("Recv", err)
        // res.status(500).send(err);
    })
})

// hackathonGetRouter.get(`${path["getSpecificHackathon"]}`, requireLogin, (req, res)=>{
//     if(req.currentUser){
//         let hackathonID = req.params.hackathonID;
//         let hackathonExistsQuery = `SELECT * FROM hackathon WHERE id='${hackathonID}'`;
//         dbObj.query(hackathonExistsQuery, (err, results)=>{
//             if(err){
//                 console.log("Can't fetch Hackathon")
//                 // return res.status(400).json({error: "Can't fetch Hackathon"})
//             }
//             if(results && results.length == 0){
//                 console.log("Hackathon doesn't exists")
//                 // return res.status(400).json({error: "Hackathon doesn't exists"})
//             } else{
//                 if(results[0]){
//                     console.log("Hackathon -", results[0])
//                     // return res.send({hackathonData: results[0]});

//                     // @TODO - Query Problem Statements
//                     let getProblemStatementsQuery = `SELECT * FROM problemStatement WHERE hackathonID='${hackathonID}'`;
//                     dbObj.query(getProblemStatementsQuery, (err, results)=>{
//                         if(err){
//                             console.log("Can't fetch Problem Statements")
//                         }

//                         if(results && results.length !=0){
//                             results.forEach(result=>{
//                                 console.log("Problem Statement -", result);
//                             })
//                         } else{
//                             console.log("No Problem Statements!!")
//                         }
//                     })

//                     // @TODO -  Query Sponsors
//                     let getSponsorsQuery = `SELECT * FROM sponsor WHERE hackathonID='${hackathonID}'`;
//                     dbObj.query(getSponsorsQuery, (err, results)=>{
//                         if(err){
//                             console.log("Can't fetch sponsors");
//                         }

//                         if(results && results.length !=0){
//                             results.forEach(result=>{
//                                 console.log("Sponsor -", result);
//                             })
//                         } else{
//                             console.log("No Sponsors")
//                         }
//                     })
//                 }
//             }
//         })

//         console.log("Hackathon Requested -", req.params.hackathonID);
//         // return res.send(req.params.hackathonID);
//     } else{
//         console.log("Not Authorized")
//         return res.status(401).json({message: "Not authorized user"})
//     }
// });


module.exports = hackathonGetRouter;