const express = require('express');
const requireLogin = require('../middlewares/require-login');
const validateOrg = require('../middlewares/validate-org');
const dbObj = require('../utils/database-obj');

const hackathonRouter = express.Router();

let path = {
    getUpcomingHackathons: "/api/hackathon/getUpcomingHackathons",
    getAllHackathons: "",
    createHackathon: "/api/hackathon/createHackathon"
}

hackathonRouter.get(`${path["getUpcomingHackathons"]}`, requireLogin, (req, res)=>{
    // console.log("Req Header", req.headers.authorization);
    // console.log("Current User", req.currentUser);
    if(req.currentUser){
        return res.send({message: "Here's are your hackathons."})
    } else{
        return res.status(401).json({message: "You're not authorized user."})
    }
});

hackathonRouter.post(`${path["createHackathon"]}`, requireLogin, validateOrg, (req, res)=>{
    if(req.validOrg == true){
        let { title, description, regStart, regEnd, hackStart, hackEnd, facebook, instagram, twitter, linkedIn, maxParticipants, problemStatements, sponsors } = req.body;

        

        if(title && description && regStart && regEnd && hackStart && hackEnd && maxParticipants && problemStatements.length !=0){
            
            let validProbStatements = 1;
            let validSponsors = 1;

            problemStatements.forEach(problemStatement=>{
                let {probTitle, probDescription, probTechnologies, probSubmissionFormat, probGuidlines, probReference} = problemStatement;
                if(probTitle && probDescription && probTechnologies && probSubmissionFormat && probGuidlines && probReference){
                    //
                } else{
                    validProbStatements = 0;
                }
            });
            
            if(sponsors.length !=0){
                sponsors.forEach(sponsor =>{
                    let {name, imageLink, webLink } = sponsor;
    
                    if(name && imageLink && webLink){
                        // Valid
                    } else{
                        validSponsors = 0;
                    }
                })
            }

            if(validProbStatements && validSponsors){
                dbObj.beginTransaction((err=>{
                    if(err){
                        return res.status(400).send({error: err});
                    }

                    let hackathonExists = ''

                }))

                return res.send({message: "Creating your hackathon...."})
            }
        }
        return res.status(400).json({message: "Please add all required fields..."})
    } else {
        return res.status(401).json({message: "Sorry! You're not a valid organization. Please create an organization account!"})
    }
});

module.exports = hackathonRouter;
