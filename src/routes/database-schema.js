const express = require('express');
const dbObj = require('../utils/database-obj');

const schemaRouter = express.Router();

paths = {
    createdb: '/api/hackathon/createdb',
    createHackathonTable: '/api/hackathon/createHackathonTable',
    createProblemStatementTable: '/api/hackathon/createProblemStatementTable',
    createSubmissionTable: '/api/hackathon/createSubmissionTable',
    createSponsorTable: '/api/hackathon/createSponsorTable'
}

queries = {
    createdb: "CREATE DATABASE hackathon",
    createHackathonTable: "CREATE TABLE IF NOT EXISTS hackathon(id VARCHAR(30) NOT NULL, title VARCHAR(100) NOT NULL, description VARCHAR(120) NOT NULL, regStart DATE NOT NULL, regEnd DATE NOT NULL, hackStart DATE NOT NULL, hackEnd DATE NOT NULL, facebook VARCHAR(100) DEFAULT '', instagram VARCHAR(100) DEFAULT '', twitter VARCHAR(100) DEFAULT '', linkedin VARCHAR(100) DEFAULT '', maxParticipants INT NOT NULL, participantCount INT DEFAULT 0, PRIMARY KEY(id))",
    createProblemStatementTable: "CREATE TABLE IF NOT EXISTS problemStatement(id VARCHAR(30) NOT NULL, hackathonID VARCHAR(30) NOT NULL, title VARCHAR(100) NOT NULL, description VARCHAR(120) NOT NULL, technologies VARCHAR(120) NOT NULL, submissionFormat VARCHAR(30) NOT NULL, guidlines VARCHAR(120) NOT NULL, refMaterial VARCHAR(100) NOT NULL, PRIMARY KEY(id), FOREIGN KEY(hackathonID) REFERENCES hackathon(id) ON DELETE CASCADE ON UPDATE CASCADE)",
    createSubmissionTable: "CREATE TABLE IF NOT EXISTS submission(id VARCHAR(30) NOT NULL, userEmail VARCHAR(50) NOT NULL, hackathonID VARCHAR(30) NOT NULL, problemStatID VARCHAR(30) NOT NULL, timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, submissionLink VARCHAR(100) NOT NULL, PRIMARY KEY(id), FOREIGN KEY(hackathonID) REFERENCES hackathon(id) ON UPDATE CASCADE ON DELETE CASCADE, FOREIGN KEY(problemStatID) REFERENCES problemStatement(id) ON UPDATE CASCADE ON DELETE CASCADE)",
    createSponsorTable: "CREATE TABLE IF NOT EXISTS sponsor(id VARCHAR(30) NOT NULL, hackathonID VARCHAR(30) NOT NULL, name VARCHAR(30) NOT NULL, imageLink VARCHAR(100) NOT NULL, webLink VARCHAR(100) NOT NULL, PRIMARY KEY(id), FOREIGN KEY(hackathonID) REFERENCES hackathon(id) ON DELETE CASCADE ON UPDATE CASCADE)"
}

// @Query - CREATE HACKATHON DATABASE
schemaRouter.get(paths['createdb'], (req, res)=>{
    dbObj.query(queries['createdb'], (err, result)=>{
        if(err){
            console.log("Error creating Database");
            throw new Error('Error creating Database');
        }

        console.log('Hackathon database created successfully');
        return res.send({message: 'Hackathon database created successfully'});
    });
});

// @Query - CREATE HACKATHON TABLE
schemaRouter.get(paths['createHackathonTable'], (req, res)=>{
    dbObj.query(queries['createHackathonTable'], (err, result)=>{
        if(err){
            console.log("Error creating Hackathon Table", err);
            throw new Error('Error creating Hackathon Table');
        }

        console.log('Hackathon table created successfully');
        return res.send({message: 'Hackathon table created successfully'});
    });
});

// @Query - CREATE PROBLEM STATEMENT TABLE
schemaRouter.get(paths['createProblemStatementTable'], (req, res)=>{
    dbObj.query(queries['createProblemStatementTable'], (err, result)=>{
        if(err){
            console.log("Error creating Prblem statement Table", err);
            throw new Error('Error creating Problem statement Table');
        }

        console.log('Problem statement Table created successfully');
        return res.send({message: 'Problem statement Table created successfully'});
    });
});

// @Query - CREATE SPONSOR DATABASE
schemaRouter.get(paths['createSponsorTable'], (req, res)=>{
    dbObj.query(queries['createSponsorTable'], (err, result)=>{
        if(err){
            console.log("Error creating Sponsor Table");
            throw new Error('Error creating Sponsor Table');
        }

        console.log('Sponsor Table created successfully');
        return res.send({message: 'Sponsor Table created successfully'});
    });
});

// @Query - CREATE SUBMISSION DATABASE
schemaRouter.get(paths['createSubmissionTable'], (req, res)=>{
    dbObj.query(queries['createSubmissionTable'], (err, result)=>{
        if(err){
            console.log("Error creating Submission Table");
            throw new Error('Error creating Submission Table');
        }

        console.log('Submission Table created successfully');
        return res.send({message: 'Submission Table created successfully'});
    });
});



module.exports = schemaRouter;