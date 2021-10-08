const express = require('express')
const axious = require('axios')
const dbObj = require('../utils/database-obj');
const requireLogin = require('../middlewares/require-login');

const hackathonGetRouter = express.Router();

let path = {
    getUpcomingHackathons: "/api/hackathon/get/upcomingHackathons",
    getAllHackathons: "/api/hackathon/get/allHackathons",
    getSpecificHackathon: "/api/hackathon/get/id/:hackathonID",
    getPastHackathon: "/api/hackathon/get/pastHackathons",
    getHackathonSummary: "/api/hackathon/get/hackathonSummary/:hackathonID"
}

hackathonGetRouter.get(
    `${path["getUpcomingHackathons"]}`,
    requireLogin,
    (req, res) => {
        // console.log("Req Header", req.headers.authorization);
        // console.log("Current User", req.currentUser);
        let date = new Date();
        let currentDate = date.toISOString().split('T')[0]
        
        if (req.currentUser) {
            let getHackathonQuery = `SELECT * from hackathon WHERE hackStart >= ${currentDate}`;
            dbObj.query(getHackathonQuery, (err, results)=>{
                if(err){
                    return res.status(400).send({error: "Can't fetch hackathon"})
                }
                if(results){
                    console.log("\n**Hackathons**\n")
                    console.log(results)
                    // return res.send({message: results})
                }
            })
            return res.send({ message: "Here's are your hackathons." });
        } else {
            return res
                .status(401)
                .json({ message: "You're not authorized user." });
        }
    }
);

hackathonGetRouter.get(`${path["getSpecificHackathon"]}`, requireLogin, (req, res)=>{
    if(req.currentUser){
        let hackathonID = req.params.hackathonID;
        let hackathonExistsQuery = `SELECT * FROM hackathon WHERE id='${hackathonID}'`;
        dbObj.query(hackathonExistsQuery, (err, results)=>{
            if(err){
                console.log("Can't fetch Hackathon")
                // return res.status(400).json({error: "Can't fetch Hackathon"})
            }
            if(results && results.length == 0){
                console.log("Hackathon doesn't exists")
                // return res.status(400).json({error: "Hackathon doesn't exists"})
            } else{
                if(results[0]){
                    console.log("Hackathon -", results[0])
                    // return res.send({hackathonData: results[0]});

                    // @TODO - Query Problem Statements
                    let getProblemStatementsQuery = `SELECT * FROM problemStatement WHERE hackathonID='${hackathonID}'`;
                    dbObj.query(getProblemStatementsQuery, (err, results)=>{
                        if(err){
                            console.log("Can't fetch Problem Statements")
                        }

                        if(results && results.length !=0){
                            results.forEach(result=>{
                                console.log("Problem Statement -", result);
                            })
                        } else{
                            console.log("No Problem Statements!!")
                        }
                    })

                    // @TODO -  Query Sponsors
                    let getSponsorsQuery = `SELECT * FROM sponsor WHERE hackathonID='${hackathonID}'`;
                    dbObj.query(getSponsorsQuery, (err, results)=>{
                        if(err){
                            console.log("Can't fetch sponsors");
                        }

                        if(results && results.length !=0){
                            results.forEach(result=>{
                                console.log("Sponsor -", result);
                            })
                        } else{
                            console.log("No Sponsors")
                        }
                    })
                }
            }
        })

        console.log("Hackathon Requested -", req.params.hackathonID);
        // return res.send(req.params.hackathonID);
    } else{
        console.log("Not Authorized")
        return res.status(401).json({message: "Not authorized user"})
    }
});


module.exports = hackathonGetRouter;