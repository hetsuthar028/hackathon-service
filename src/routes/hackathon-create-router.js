const express = require("express");
const dbObj = require("../utils/database-obj");
const requireLogin = require("../middlewares/require-login");
const validateOrg = require("../middlewares/validate-org");
const { v4: uuid4, validate } = require("uuid");
const async = require("async");
const hackathonCreateRouter = express.Router();

const path = {
    createHackathon: "/api/hackathon/create",
};

hackathonCreateRouter.post(
    `${path["createHackathon"]}`,
    // requireLogin,
    // validateOrg,
    (req, res) => {
        
        // Testing Purpose [Because we've removed the 2 middlewares in the above request]
        req.validOrg = true

        async
            .auto({
                validate_org: function (callback) {
                    if (req.validOrg == true) {
                        callback(null, "valid");
                    } else {
                        callback("Not a valid user", null);
                    }
                },

                validate_inputs: [
                    "validate_org",
                    function (result, callback) {
                        try{
                            let {
                                hackTitle,
                                hackDescription,
                                hackCompanyName,
                                regStart,
                                regEnd,
                                hackStart,
                                hackEnd,
                                totalApplications,
                                submissionFormats, 
                                submissionGuidelines,
                                facebook,
                                instagram,
                                twitter,
                                linkedIn,
                                firstPrizeDesc,
                                secondPrizeDesc,
                                thirdPrizeDesc,
                                problemStatements,
                                sponsors,
                            } = req.body;
    
                            if (
                                hackTitle &&
                                hackDescription &&
                                hackCompanyName &&
                                regStart &&
                                regEnd &&
                                hackStart &&
                                hackEnd &&
                                totalApplications &&
                                firstPrizeDesc &&
                                secondPrizeDesc &&
                                thirdPrizeDesc &&
                                submissionFormats &&
                                submissionGuidelines &&
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
                                        probAcceptedTechs,
                                        probRefLinks,
                                    } = problemStatement;
                                    if (
                                        probTitle &&
                                        probDescription &&
                                        probAcceptedTechs &&
                                        probRefLinks
                                    ) {
                                        //
                                    } else {
                                        validProbStatements = 0;
                                        callback("Invalid Inputs 1", null);
                                        return;
                                    }
                                });
    
                                if (sponsors.length != 0) {
                                    sponsors.forEach((sponsor) => {
                                        let { sponsorName, sponsorImageLink, sponsorWebLink } = sponsor;
    
                                        if (sponsorName && sponsorImageLink && sponsorWebLink) {
                                            // Valid
                                        } else {
                                            validSponsors = 0;
                                            callback("Invalid Inputs 2", null);
                                            return;
                                        }
                                    });
                                }
    
                                if (validProbStatements && validSponsors) {
                                    return callback(null, "valid");
                                } else {
                                    callback("Invalid Inputs 3", null);
                                    return;
                                }
                            } else {
                                callback("Invalid Inputs 4", null);
                                return;
                            }
                        }
                        catch(err) {
                            callback("Invalid Inputs 5", null);
                                return;
                        }
                        
                    },
                ],

                // Check for Existing Hackathon
                check_existing_hackathon: [
                    "validate_inputs",
                    function (result, callback) {
                        let {
                            hackTitle,
                        } = req.body;
                        console.log("Validation = ", result)
                        let hackathonExists = `SELECT title, organizedBy FROM hackathon where title='${hackTitle}'`;
                        
                        dbObj.query(hackathonExists, (err, results) => {
                            
                            if (err) {  
                                callback(
                                    "Error fetching the hackathon from database",
                                    null
                                );
                                return;
                            }
                            if (results.length != 0) {
                                callback("Hackathon already exists", null);
                                return;
                            }
                            callback(null, "valid");
                        });
                    },
                ],

                // Add hackathon into Hackathon Database
                add_hackathon_db: [
                    "check_existing_hackathon",
                    function (result, callback) {
                        console.log("Existing = ", result)
                        let {
                            hackTitle,
                            hackDescription,
                            hackCompanyName,
                            regStart,
                            regEnd,
                            hackStart,
                            hackEnd,
                            totalApplications,
                            submissionFormats, 
                            submissionGuidelines,
                            facebook,
                            instagram,
                            twitter,
                            linkedIn,
                            firstPrizeDesc,
                            secondPrizeDesc,
                            thirdPrizeDesc,
                        } = req.body;

                        let uniqueHackathonID = uuid4();
                        let addHackathonQuery = `INSERT INTO hackathon(id, title, description, organizedBy, regStart, regEnd, hackStart, hackEnd, maxParticipants, submissionFormats, submissionGuidelines, facebook, instagram, twitter, linkedin, firstPrizeDesc, secondPrizeDesc, thirdPrizeDesc) 
                                                VALUES('${uniqueHackathonID}', '${hackTitle}', '${hackDescription}', '${hackCompanyName}', STR_TO_DATE("${regStart}","%d-%m-%Y"), STR_TO_DATE("${regEnd}","%d-%m-%Y"), STR_TO_DATE("${hackStart}","%d-%m-%Y"), STR_TO_DATE("${hackEnd}","%d-%m-%Y"), ${totalApplications}, '${submissionFormats}', '${submissionGuidelines}', '${facebook}', '${instagram}', '${twitter}', '${linkedIn}', '${firstPrizeDesc}', '${secondPrizeDesc}', '${thirdPrizeDesc}')`;

                        dbObj.query(addHackathonQuery, (err, results) => {
                            if (err) {
                                console.log("ERR = ", err)
                                callback(
                                    "Error adding the hackathon to table",
                                    null
                                );
                                dbObj.rollback();
                                return;
                            }

                            callback(null, {
                                message: "hackathon added",
                                uniqueHackathonID: uniqueHackathonID,
                            });
                        });

                        // callback(null, 'hackathon added', uniqueHackathonID)
                    },
                ],

                // Add sponsors into DB
                add_sponsors_db: [
                    "add_hackathon_db",
                    function (result, callback) {
                        let uniqueHackathonID =
                            result.add_hackathon_db.uniqueHackathonID;

                        console.log("Add Hackathon result =", result);
                        let {
                            sponsors,
                        } = req.body;

                        // async
                        //     .auto({
                        //         add_sponsors: function (callback) {
                        sponsors.forEach((sponsor) => {
                            let sponsorID = uuid4();
                            let { sponsorName, sponsorImageLink, sponsorWebLink } = sponsor;
                            let addSponsorQuery = `INSERT INTO sponsor(id, hackathonID, name, imageLink, webLink) VALUES('${sponsorID}', '${uniqueHackathonID}', '${sponsorName}', '${sponsorImageLink}', '${sponsorWebLink}')`;

                            dbObj.query(addSponsorQuery, (err, result) => {
                                if (err) {
                                    callback(
                                        "Error adding sponsors into database",
                                        null
                                    );
                                    dbObj.rollback();
                                    return;
                                }
                            });
                        });
                        callback(null, "sponsors added");
                    },
                ],

                // Add problem statements into DB
                add_problem_statements_db: [
                    "add_sponsors_db",
                    function (result, callback) {
                        console.log("Sponsors Data =", result);
                        let uniqueHackathonID =
                            result.add_hackathon_db.uniqueHackathonID;

                        let {
                            problemStatements,
                        } = req.body;

                        problemStatements.forEach((problemStatement) => {
                            let problemStatementID = uuid4();
                            let {
                                probTitle,
                                probDescription,
                                probAcceptedTechs,
                                probRefLinks,
                                probSolutionType
                            } = problemStatement;
                            let addProblemStatementQuery = `INSERT INTO problemStatement(id, hackathonID, title, description, technologies, solutionType, refMaterial)
                                                        VALUES('${problemStatementID}', '${uniqueHackathonID}', '${probTitle}', '${probDescription}', '${probAcceptedTechs}', '${probSolutionType}' ,'${probRefLinks}')`;

                            dbObj.query(
                                addProblemStatementQuery,
                                (err, result) => {
                                    if (err) {
                                        callback(
                                            "Error adding sponsors into database",
                                            null
                                        );
                                        dbObj.rollback();
                                        return;
                                    }
                                }
                            );
                        });
                        callback(null, 'Problem statements added')
                    },
                ]
            })
            .then((results) => {
                console.log("Results =", results);
                return res.json(results)
            })
            .catch((err) => {
                console.log("Error =", err);
                return res.status(500).send(err);
            });
    }
);

// hackathonCreateRouter.post(
//     `${path["createHackathon"]}`,
//     requireLogin,
//     validateOrg,
//     (req, res) => {
//         if (req.validOrg == true) {
//             let {
//                 title,
//                 description,
//                 organizedBy,
//                 regStart,
//                 regEnd,
//                 hackStart,
//                 hackEnd,
//                 facebook,
//                 instagram,
//                 twitter,
//                 linkedIn,
//                 maxParticipants,
//                 firstPrizeDesc,
//                 secondPrizeDesc,
//                 thirdPrizeDesc,
//                 problemStatements,
//                 sponsors,
//             } = req.body;

//             if (
//                 title &&
//                 description &&
//                 organizedBy &&
//                 regStart &&
//                 regEnd &&
//                 hackStart &&
//                 hackEnd &&
//                 maxParticipants &&
//                 firstPrizeDesc &&
//                 secondPrizeDesc &&
//                 thirdPrizeDesc &&
//                 problemStatements.length != 0
//             ) {
//                 let validProbStatements = 1;
//                 let validSponsors = 1;

//                 if (!facebook) {
//                     facebook = "";
//                 }

//                 if (!instagram) {
//                     instagram = "";
//                 }

//                 if (!twitter) {
//                     twitter = "";
//                 }

//                 if (!linkedIn) {
//                     linkedIn = "";
//                 }

//                 problemStatements.forEach((problemStatement) => {
//                     let {
//                         probTitle,
//                         probDescription,
//                         probTechnologies,
//                         probSubmissionFormat,
//                         probGuidelines,
//                         probReference,
//                     } = problemStatement;
//                     if (
//                         probTitle &&
//                         probDescription &&
//                         probTechnologies &&
//                         probSubmissionFormat &&
//                         probGuidelines &&
//                         probReference
//                     ) {
//                         //
//                     } else {
//                         validProbStatements = 0;
//                     }
//                 });

//                 if (sponsors.length != 0) {
//                     sponsors.forEach((sponsor) => {
//                         let { name, imageLink, webLink } = sponsor;

//                         if (name && imageLink && webLink) {
//                             // Valid
//                         } else {
//                             validSponsors = 0;
//                         }
//                     });
//                 }

//                 if (validProbStatements && validSponsors) {
//                     dbObj.beginTransaction((err) => {
//                         if (err) {
//                             console.log("Error - Not Valid Prob Statement & Sponsor")
//                             // return res.status(400).send({ error: err });
//                         }

//                         let hackathonExists = `SELECT title, organizedBy FROM hackathon where title='${title}'`;

//                         dbObj.query(hackathonExists, (err, results) => {
//                             if (err) {
//                                 console.log("Error performing query - Hackathon Exists", err);
//                                 // return res.status(400).json({ error: err });
//                             }
//                             if (results.length != 0) {
//                                 console.log("Hackathon Already exists");
//                                 // return res
//                                 //     .status(400)
//                                 //     .json({
//                                 //         error: "Hackathon already exists with same title",
//                                 //     });
//                             }

//                             // Add a Hackathon into Table
//                             let uniqueHackathonID = uuid4();
//                             let addHackathonQuery = `INSERT INTO hackathon(id, title, description, organizedBy, regStart, regEnd, hackStart, hackEnd, facebook, instagram, twitter, linkedin, maxParticipants, firstPrizeDesc, secondPrizeDesc, thirdPrizeDesc)
//                                                 VALUES('${uniqueHackathonID}', '${title}', '${description}', '${organizedBy}', STR_TO_DATE("${regStart}","%d-%m-%Y"), STR_TO_DATE("${regEnd}","%d-%m-%Y"), STR_TO_DATE("${hackStart}","%d-%m-%Y"), STR_TO_DATE("${hackEnd}","%d-%m-%Y"), '${facebook}', '${instagram}', '${twitter}', '${linkedIn}', ${maxParticipants}, '${firstPrizeDesc}', '${secondPrizeDesc}', '${thirdPrizeDesc}')`;

//                             dbObj.query(addHackathonQuery, (err, results) => {
//                                 if (err) {
//                                     console.log("Error performing query - Insert Hackahton", err);
//                                     return dbObj.rollback();
//                                     // return res
//                                     //     .status(400)
//                                     //     .json({
//                                     //         error: "Error while adding data",
//                                     //     });
//                                 }

//                                 // Add Sponsors into Table

//                                 let sponsordAddedStatus = true;
//                                 sponsors.forEach((sponsor) => {
//                                     let sponsorID = uuid4();
//                                     let { name, imageLink, webLink } = sponsor;
//                                     let addSponsorQuery = `INSERT INTO sponsor(id, hackathonID, name, imageLink, webLink) VALUES('${sponsorID}', '${uniqueHackathonID}', '${name}', '${imageLink}', '${webLink}')`;

//                                     dbObj.query(
//                                         addSponsorQuery,
//                                         (err, result) => {
//                                             if (err) {
//                                                 console.log(
//                                                     "Error performing query - INSERT SPOSNOR",
//                                                     err
//                                                 );
//                                                 return dbObj.rollback();
//                                                 sponsordAddedStatus = false;
//                                                 console.log("ERROR - INSERT SPOSNOR")
//                                                 // return res
//                                                 //     .status(400)
//                                                 //     .json({
//                                                 //         error: "Error while adding data",
//                                                 //     });
//                                             }
//                                         }
//                                     );
//                                 });

//                                 if (sponsordAddedStatus) {
//                                     // Add Problem Statements into Table

//                                     let problemStatementAddedStatus = true;
//                                     problemStatements.forEach((problemStatement) => {
//                                         let problemStatementID = uuid4();
//                                         let { probTitle, probDescription, probTechnologies, probSubmissionFormat, probGuidelines, probReference } = problemStatement;
//                                         let addProblemStatementQuery = `INSERT INTO problemStatement(id, hackathonID, title, description, technologies, submissionFormat, guidelines, refMaterial)
//                                                                         VALUES('${problemStatementID}', '${uniqueHackathonID}', '${probTitle}', '${probDescription}', '${probTechnologies}', '${probSubmissionFormat}', '${probGuidelines}', '${probReference}')`;

//                                         dbObj.query(
//                                             addProblemStatementQuery,
//                                             (err, result) => {
//                                                 if (err) {
//                                                     console.log(
//                                                         "Error occured while performing query - INSERT PROBSTATE",
//                                                         err
//                                                     );
//                                                     dbObj.rollback();
//                                                     problemStatementAddedStatus = false;
//                                                     console.log("ERROR - INSERT PROBSTATE")
//                                                     // return res
//                                                     //     .status(400)
//                                                     //     .json({
//                                                     //         error: "Error while adding data",
//                                                     //     });
//                                                 }
//                                             }
//                                         );
//                                     });

//                                     if(problemStatementAddedStatus){
//                                         dbObj.commit();
//                                         console.log("HACKATHON CREATED")
//                                         // return res.status(200).send({message: "Hackathon created successfully"});
//                                     } else{
//                                         return dbObj.rollback();
//                                         console.log("ERROR - PROBSTATE NOT ADDED")
//                                         // return res.status(400).json({error: "Can't add data"});
//                                     }
//                                 }
//                             });
//                         });
//                     });
//                     console.log("ERROR FINAL")
//                     // return res.send({ error: "Error occrured while creating hackathon. Please try again!" });
//                 }
//             }
//             console.log("ERROR - ADD ALL FIELDS")
//             // return res
//             //     .status(400)
//             //     .json({ message: "Please add all required fields..." });
//         } else {
//             console.log("ERROR - NOT VALID")
//             // return res
//             //     .status(401)
//             //     .json({
//             //         message:
//             //             "Sorry! You're not a valid organization. Please create an organization account!",
//             //     });
//         }
//     }
// );

module.exports = hackathonCreateRouter;
