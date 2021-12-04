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
    getSubmissions: "/api/hackathon/get/submissions/:hackathonID",
    getCurrentlyRegistered: "/api/hackathon/get/checkregistration/:hackathonID",
    getMyHackathons: "/api/hackathon/get/myhackathons"
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
                        let getHackathonQuery = `SELECT * from hackathon WHERE convert_tz(hackEnd, '+00:00','+05:30') >= '${currentDate}'`;
    
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
    // date.setDate(date.getDate());
    let currentDate = date.toISOString().split('T')[0]
    console.log("Current Date", date.toLocaleString(undefined, {timeZone: 'Asia/Kolkata'}));

    let tempDate = new Date().toLocaleString(undefined, {timeZone: 'Asia/Kolkata'});
    console.log("TEMP DATE", tempDate);

    async.auto({
        get_past_hackathons_db: 
            function(callback){
                let getPastHackathonsQuery = `SELECT * FROM hackathon where convert_tz(hackEnd, '+00:00','+05:30') < '${currentDate}'`;

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

hackathonGetRouter.get(`${path["getSubmissions"]}`, (req, res) => {
    let paramHackathonID = req.params.hackathonID;
    let userData = [];

    console.log("Got Submission GET REQUEST");
    try{
        let getSubmissionsQuery = `SELECT * FROM submission WHERE hackathonID='${paramHackathonID}'`
        
        dbObj.query(getSubmissionsQuery, (err, submissionData) => {
            if(err){
                console.log("Error getting submissions from DB");
                return res.status(500).send({success: false, errors: JSON.stringify(err)});
            }

            console.log("Submission Data", submissionData)

            if(submissionData.length > 0){
                submissionData.map((d, idx) => {
                    console.log("Inside Map")
                    axios.get(`http://localhost:4200/api/user/get/${d.userEmail}`).then((user) => {
                        
                        userData.push(user.data.user);
    
                        if(userData.length == submissionData.length){
                            console.log("Sent User Data")
                            return res.status(200).send({success: true, submissions: submissionData, users: userData});
                        }
    
                    }).catch((err) => {
                        console.log("Error getting user in Sub Route", err);
                        return res.status(500).send({success: false, errors: JSON.stringify(err.response)});
                    })
    
                    
                });
            } else {
                console.log("SENT RESP")
                return res.status(200).send({success: true, submissions: submissionData, users: userData});
            }
            console.log("OutSide")
        })
    } catch(err){
        console.log("Invalid Hackathon ID in Submission Request", err);
        return res.status(500).send({success: false, errors: 'Invalid hackathon in submissions request'});
    }
});

hackathonGetRouter.get('/api/hackathon/get/winners/:hackathonID', (req, res) => {
    let hackathonID = req.params.hackathonID;
    if(!hackathonID){
        return res.status(500).send({success: false, errors: 'Invalid hackathon'});
    }

    let getWinnersQuery = `SELECT * FROM winner WHERE hackathonID='${hackathonID}'`;
    dbObj.query(getWinnersQuery, (err, data) => {
        if(err){
            console.log("Error getting winners from DB", err);
            return res.status(500).send({success: false, errors: JSON.stringify(err)});
        }

        return res.status(200).send({success: true, data});
    })
});


hackathonGetRouter.get(path["getMyHackathons"], (req, res) => {
    let authHeader = req.headers.authorization;

    try{
        async.auto({
            check_current_user: function(callback){
                axios.get(`http://localhost:4200/api/user/currentuser`, {
                    headers: {
                        authorization: authHeader,
                    }
                }).then((responses) => {
                    let cUser = responses.data.currentUser;
                    if(cUser){
                        callback(null, {currentUser: cUser});
                    } else {
                        callback('Invalid user', null)
                    }
                })
            },

            validate_user_type: [
                "check_current_user",
                function(result, callback){
                    let user = result.check_current_user.currentUser;

                    if(user.userType == "organization"){
                        callback(null, 'valid')
                    } else {
                        callback('Invalid user', null);
                    }
                }
            ],

            get_my_hackathons: [
                "validate_user_type",
                function(result, callback){
                    let user = result.check_current_user.currentUser;

                    let getMyHackathonsQuery = `SELECT * FROM hackathon WHERE organiserEmail='${user.email}'`;

                    try{
                        dbObj.query(getMyHackathonsQuery, (err, data) => {
                            if(err){
                                callback('Error fetching hackathons from DB', null)
                            }

                            return callback(null, {myHackathons: data})
                        })
                    } catch(err){
                        callback('Error fetching hackathons', null);
                    }
                }
            ]

        }).then((responses) => {
            return res.json(responses);
        }).catch((errs) => {
            return res.status(500).send(errs);
        })
    }catch(err){

    }

})


module.exports = hackathonGetRouter;