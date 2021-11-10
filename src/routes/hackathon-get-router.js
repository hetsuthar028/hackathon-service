const express = require('express')
const axios = require('axios')
const dbObj = require('../utils/database-obj');
const requireLogin = require('../middlewares/require-login');
const async = require('async');
const jwt = require('jsonwebtoken');
const { restart } = require('nodemon');

const hackathonGetRouter = express.Router();

let path = {
    getUpcomingHackathons: "/api/hackathon/get/upcomingHackathons",
    getAllHackathons: "/api/hackathon/get/allHackathons",
    getSpecificHackathon: "/api/hackathon/get/id/:hackathonID",
    getPastHackathon: "/api/hackathon/get/pastHackathons",
    getHackathonSummary: "/api/hackathon/get/hackathonSummary/:hackathonID",
    getCurrentlyRegistered: "/api/hackathon/get/checkregistration/:hackathonID"
}

// Get Upcoming Hackathons - Async
hackathonGetRouter.get(
    `${path['getUpcomingHackathons']}`,
    (req, res)=>{

        let date = new Date();
        let currentDate = date.toISOString().split('T')[0]
        console.log("Got Upcoming Hackathon request")
        console.log("Current Date Format", currentDate);
        // Async
        async.auto({

            // Removed for Testing Purpose

            check_current_user: function(callback){

                let hdr = req.headers;
    
                if(hdr){
                    console.log("Header", hdr);
                    if(hdr.authorization){
                        console.log("HEADER AUTH", hdr.authorization)
                        axios.get('http://localhost:4200/api/user/currentuser', {
                            headers: {
                                authorization: hdr.authorization
                            }
                        }).then(response=>{
                            // console.log("Login", response.data)
                            req.currentUser = response.data.currentUser;
                            // console.log("C User", req.currentUser)
                            if(!req.currentUser){
                                callback('Invalid user', null)
                                return;
                            }
                            callback(null, {message: 'valid', currentUser: req.currentUser})
                        }).catch(err=>{
                            callback('User not validated', null);
                            // return res.status(400).send({message: "User not validated"})
                        })
                    }
                }
            },

            get_upcoming_hackathons: 
                [
                    "check_current_user",
                    function(result, callback){
                        let getHackathonQuery = `SELECT * from hackathon WHERE date(hackStart) >= '${currentDate}'`;
    
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
                ]
                // Removed these things for testing purpose
                // "check_current_user",
                // Add ["check_current_user", later on
                // Add result parameter to below function

                
            
        }).then(responses => {
            console.log("Responses", responses);
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
    
    // // Temp Current User [Because we've removed "requireLogin" middleware from above request]
    req.currentUser = {
        email : "hetmewada0028@gmail.com"
    }
    async.auto({
        check_current_user : function(callback){
            console.log("Current USER FUNCTION ASYNC", req.currentUser)
            if(!req.currentUser){
                callback('Invalid user', {message: "Invalid user"})
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
                    console.log("Valid SEnd HACK", results[0])
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
                        console.log("Valid send prob", results[0])
                        callback(null, {message: 'valid', problemStatements: results})
                    }
                })
            }
        ],

        get_sponsors_db: [
            "get_problem_statements_db",
            function(result, callback){
                let hackathonID = result.get_hackathon_db.hackathon.id;
                let getSponsorsQuery = `SELECT * FROM sponsor WHERE hackathonID='${hackathonID}'`;

                dbObj.query(getSponsorsQuery, (err, results)=>{
                    if(err){
                        callback('Error fetching sponsors from DB', null)
                        return;
                    }
                    if(results && results.length !=0){
                        console.log("Valid send sponsors", results[0])
                        callback(null, {message: 'valid', sponsors: results})
                    }
                })
            }
        ],
        get_sliders_db: [
            "get_sponsors_db",
            function(result, callback){
                let hackathonID = result.get_hackathon_db.hackathon.id;
                let getSlidersQuery = `SELECT * FROM slider WHERE hackathonID='${hackathonID}'`;

                dbObj.query(getSlidersQuery, (err, results) => {
                    if(err){
                        callback('Error fetching sliders from DB', null);
                        return;
                    }
                    if(results && results.length !=0){
                        console.log("Valid send slider", results[0])
                        callback(null, {success: true, sliders: results});
                    } else {
                        console.log("Empty sliders")
                        return callback(null, {success: true, sliders: results});
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
        res.status(401).send(err);
    })
});


hackathonGetRouter.post(`${path['getCurrentlyRegistered']}`, 
    (req, res) => {
        
        // @Work-Around
        // We'll have ContextAPI here to get the current user data

        // let currentUser = {
            // email: "hetmewada0028@gmail.com",
            // userType: "developer",
            // userName: "Het Suthar"
        // }

        let { currentUser } = req.body;
        console.log("Current User Check Registration", req.params, req.body)

        // @Query - Check if user is already registered
        let checkUserRegistration = `SELECT * FROM registration where userEmail='${currentUser.email}' and hackathonID='${req.params.hackathonID}'`;

        dbObj.query(checkUserRegistration, (err, results)=> {
            if(err){
                console.log("Error checking registration status")
                return res.status(500).send('Error checking registration status')
            }

            if(results && results.length !=0){
                return res.status(200).send({message: 'already registered'})
            } else {
                return res.status(200).send({message: 'not registered'})
            }
        })
    }
)

hackathonGetRouter.get(`${path["getPastHackathon"]}`, (req, res) => {
    let date = new Date();
    let currentDate = date.toISOString().split('T')[0]

    async.auto({
        // check_current_user: function(callback){
        //     let hdr = req.headers;

        //     if(hdr){
        //         console.log("Header", hdr);
        //         if(hdr.authorization){
        //             console.log("HEADER AUTH", hdr.authorization)
        //             axios.get('http://localhost:4200/api/user/currentuser', {
        //                 headers: {
        //                     authorization: hdr.authorization
        //                 }
        //             }).then(response=>{
        //                 // console.log("Login", response.data)
        //                 req.currentUser = response.data.currentUser;
        //                 // console.log("C User", req.currentUser)
        //                 if(!req.currentUser){
        //                     callback('Invalid user', null)
        //                     return;
        //                 }
        //                 callback(null, {message: 'valid', currentUser: req.currentUser})
        //             }).catch(err=>{
        //                 callback('User not validated', null);
        //                 // return res.status(400).send({message: "User not validated"})
        //             })
        //         } else {
        //             return callback('No Auth Header - Invalid user', null);
        //         }
        //     } else {
        //         return callback('No headers - Invalid user', null);
        //     }
        // },

        get_past_hackathons_db: 
            function(callback){
                let getPastHackathonsQuery = `SELECT * FROM hackathon where date(hackEnd) <= '${currentDate}'`;

                dbObj.query(getPastHackathonsQuery, (err, results) => {
                    if(err){
                        console.log("Error fetching past hackathons")
                        return callback("Error fetching past hackathons", null);
                    }

                    if(results && results.length == 0){
                        return callback('No upcoming hackathons', null);
                    }
                    
                    return callback(null, {message: 'valid', pastHackathons: results})
                })
            }
        
    }).then((responses) => {
        console.log("Responses", responses);
        return res.status(200).send({success: true, responses })
    }).catch((err) => {
        return res.status(500).send(err);
    })


});

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