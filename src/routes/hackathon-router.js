const express = require("express");
const requireLogin = require("../middlewares/require-login");
const validateOrg = require("../middlewares/validate-org");
const dbObj = require("../utils/database-obj");
const { v4: uuid4 } = require("uuid");

const hackathonRouter = express.Router();

let path = {
    getUpcomingHackathons: "/api/hackathon/getUpcomingHackathons",
    getAllHackathons: "",
    createHackathon: "/api/hackathon/createHackathon",
    getSpecificHackathon: "/api/hackathon/getHackathon/:hackathonID",
    registerForHackathon: "/api/hackathon/register/:hackathonID"
};

hackathonRouter.get(
    `${path["getUpcomingHackathons"]}`,
    requireLogin,
    (req, res) => {
        // console.log("Req Header", req.headers.authorization);
        // console.log("Current User", req.currentUser);
        if (req.currentUser) {
            return res.send({ message: "Here's are your hackathons." });
        } else {
            return res
                .status(401)
                .json({ message: "You're not authorized user." });
        }
    }
);

hackathonRouter.post(
    `${path["createHackathon"]}`,
    requireLogin,
    validateOrg,
    (req, res) => {
        if (req.validOrg == true) {
            let {
                title,
                description,
                organizedBy,
                regStart,
                regEnd,
                hackStart,
                hackEnd,
                facebook,
                instagram,
                twitter,
                linkedIn,
                maxParticipants,
                problemStatements,
                sponsors,
            } = req.body;

            if (
                title &&
                description &&
                organizedBy &&
                regStart &&
                regEnd &&
                hackStart &&
                hackEnd &&
                maxParticipants &&
                problemStatements.length != 0
            ) {
                let validProbStatements = 1;
                let validSponsors = 1;

                if (!facebook) {
                    facebook = "";
                }

                if (!instagram) {
                    instagram = "";
                }

                if (!twitter) {
                    twitter = "";
                }

                if (!linkedIn) {
                    linkedIn = "";
                }

                problemStatements.forEach((problemStatement) => {
                    let {
                        probTitle,
                        probDescription,
                        probTechnologies,
                        probSubmissionFormat,
                        probGuidelines,
                        probReference,
                    } = problemStatement;
                    if (
                        probTitle &&
                        probDescription &&
                        probTechnologies &&
                        probSubmissionFormat &&
                        probGuidelines &&
                        probReference
                    ) {
                        //
                    } else {
                        validProbStatements = 0;
                    }
                });

                if (sponsors.length != 0) {
                    sponsors.forEach((sponsor) => {
                        let { name, imageLink, webLink } = sponsor;

                        if (name && imageLink && webLink) {
                            // Valid
                        } else {
                            validSponsors = 0;
                        }
                    });
                }

                if (validProbStatements && validSponsors) {
                    dbObj.beginTransaction((err) => {
                        if (err) {
                            console.log("Error - Not Valid Prob Statement & Sponsor")
                            // return res.status(400).send({ error: err });
                        }

                        let hackathonExists = `SELECT title, organizedBy FROM hackathon where title='${title}'`;

                        dbObj.query(hackathonExists, (err, results) => {
                            if (err) {
                                console.log("Error performing query - Hackathon Exists", err);
                                // return res.status(400).json({ error: err });
                            }
                            if (results.length != 0) {
                                console.log("Hackathon Already exists");
                                // return res
                                //     .status(400)
                                //     .json({
                                //         error: "Hackathon already exists with same title",
                                //     });
                            }

                            // Add a Hackathon into Table
                            let uniqueHackathonID = uuid4();
                            let addHackathonQuery = `INSERT INTO hackathon(id, title, description, organizedBy, regStart, regEnd, hackStart, hackEnd, facebook, instagram, twitter, linkedin, maxParticipants) 
                                                VALUES('${uniqueHackathonID}', '${title}', '${description}', '${organizedBy}', STR_TO_DATE("${regStart}","%d-%m-%Y"), STR_TO_DATE("${regEnd}","%d-%m-%Y"), STR_TO_DATE("${hackStart}","%d-%m-%Y"), STR_TO_DATE("${hackEnd}","%d-%m-%Y"), '${facebook}', '${instagram}', '${twitter}', '${linkedIn}', ${maxParticipants})`;

                            dbObj.query(addHackathonQuery, (err, results) => {
                                if (err) {
                                    console.log("Error performing query - Insert Hackahton", err);
                                    return dbObj.rollback();
                                    // return res
                                    //     .status(400)
                                    //     .json({
                                    //         error: "Error while adding data",
                                    //     });
                                }

                                // Add Sponsors into Table
                                
                                let sponsordAddedStatus = true;
                                sponsors.forEach((sponsor) => {
                                    let sponsorID = uuid4();
                                    let { name, imageLink, webLink } = sponsor;
                                    let addSponsorQuery = `INSERT INTO sponsor(id, hackathonID, name, imageLink, webLink) VALUES('${sponsorID}', '${uniqueHackathonID}', '${name}', '${imageLink}', '${webLink}')`;
                                    
                                    dbObj.query(
                                        addSponsorQuery,
                                        (err, result) => {
                                            if (err) {
                                                console.log(
                                                    "Error performing query - INSERT SPOSNOR",
                                                    err
                                                );
                                                return dbObj.rollback();
                                                sponsordAddedStatus = false;
                                                console.log("ERROR - INSERT SPOSNOR")
                                                // return res
                                                //     .status(400)
                                                //     .json({
                                                //         error: "Error while adding data",
                                                //     });
                                            }
                                        }
                                    );
                                });

                                if (sponsordAddedStatus) {
                                    // Add Problem Statements into Table
                                    
                                    let problemStatementAddedStatus = true;
                                    problemStatements.forEach((problemStatement) => {
                                        let problemStatementID = uuid4();
                                        let { probTitle, probDescription, probTechnologies, probSubmissionFormat, probGuidelines, probReference } = problemStatement;
                                        let addProblemStatementQuery = `INSERT INTO problemStatement(id, hackathonID, title, description, technologies, submissionFormat, guidelines, refMaterial)
                                                                        VALUES('${problemStatementID}', '${uniqueHackathonID}', '${probTitle}', '${probDescription}', '${probTechnologies}', '${probSubmissionFormat}', '${probGuidelines}', '${probReference}')`;
                                        
                                        dbObj.query(
                                            addProblemStatementQuery,
                                            (err, result) => {
                                                if (err) {
                                                    console.log(
                                                        "Error occured while performing query - INSERT PROBSTATE",
                                                        err
                                                    );
                                                    dbObj.rollback();
                                                    problemStatementAddedStatus = false;
                                                    console.log("ERROR - INSERT PROBSTATE")
                                                    // return res
                                                    //     .status(400)
                                                    //     .json({
                                                    //         error: "Error while adding data",
                                                    //     });
                                                }
                                            }
                                        );
                                    });

                                    if(problemStatementAddedStatus){
                                        dbObj.commit();
                                        console.log("HACKATHON CREATED")
                                        // return res.status(200).send({message: "Hackathon created successfully"});
                                    } else{
                                        return dbObj.rollback();
                                        console.log("ERROR - PROBSTATE NOT ADDED")
                                        // return res.status(400).json({error: "Can't add data"});
                                    }
                                }
                            });
                        });
                    });
                    console.log("ERROR FINAL")
                    // return res.send({ error: "Error occrured while creating hackathon. Please try again!" });
                }
            }
            console.log("ERROR - ADD ALL FIELDS")
            // return res
            //     .status(400)
            //     .json({ message: "Please add all required fields..." });
        } else {
            console.log("ERROR - NOT VALID")
            // return res
            //     .status(401)
            //     .json({
            //         message:
            //             "Sorry! You're not a valid organization. Please create an organization account!",
            //     });
        }
    }
);

hackathonRouter.get(`${path["getSpecificHackathon"]}`, requireLogin, (req, res)=>{
    if(req.currentUser){
        console.log(req.params.hackathonID)
        let hackathonExistsQuery = `SELECT * FROM hackathon WHERE id='${req.params.hackathonID}'`;
        dbObj.query(hackathonExistsQuery, (err, results)=>{
            if(err){
                console.log("Can't fetch Hackathon")
                // return res.status(400).json({error: "Can't fetch Hackathon"})
            }
            if(results && results[0].length == 0){
                console.log("Hackathon doesn't exists")
                // return res.status(400).json({error: "Hackathon doesn't exists"})
            } else{
                if(results[0]){
                    console.log("Got it", results[0])
                    // return res.send({hackathonData: results[0]});
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

hackathonRouter.post(`${path["registerForHackathon"]}`, requireLogin, (req, res)=>{
    if(req.currentUser){
        let hackathonID = req.params.hackathonID;
        if(hackathonID){
            let hackathonExistsQuery = `SELECT id FROM hackathon WHERE id='${hackathonID}'`
            dbObj.query(hackathonExistsQuery, (err, results)=>{
                if(err){
                    return console.log("Error getting Hackathon");
                }
                if(results && results[0].length !=0){
                    let uniqueRegID = uuid4();
                    let registrationQuery = `INSERT INTO registration(id, userEmail, hackathonID) VALUES('${uniqueRegID}', '${req.currentUser.email}', '${hackathonID}')`;
                    dbObj.query(registrationQuery, (err, results)=>{
                        if(err){
                            return console.log("You're already registered for a Hackathon");
                        }
                        return console.log("You're registered for the hackathon");
                    })
                }
            })
        }
    } else{
        return res.status(401).json({message: "Not Authorized"});
    }
})

module.exports = hackathonRouter;
