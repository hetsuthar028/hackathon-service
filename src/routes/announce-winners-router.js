require('dotenv').config();
const express = require('express');
const announceWinnersRouters = express.Router();
const async = require('async');
const { default: axios } = require('axios');
const dbObj = require('../utils/database-obj');

announceWinnersRouters.post('/api/hackathon/announce/winners', (req, res) => {
    let { winnersInput: winners, hackathonID } = req.body;
    
    let userData = {};
    console.log("Winners", winners)

    if(Object.keys(winners).length ==3){
        async.auto({
            fetch_username_db:
                function(callback){
                    for(let prop in winners){
                        axios.get(`http://localhost:4200/api/user/get/username/${winners[prop]}`)
                            .then((userNameResp) => {
                                console.log("Username", userNameResp.data.data);

                                userData[prop] = userNameResp.data.data;
                                console.log("Length", userData)

                                if(Object.keys(userData).length == 3){
                                    callback(null, {success: true, userData: userData});
                                }
                            }).catch((err) => {
                                console.log("Error 2", err);
                            })
                        
                        
                    }
            },

            validate_username_db: [
                "fetch_username_db",
                function(result, callback){
                    let validFlag = 1;
                    for(let prop in userData){
                        if(userData[prop].length == 0){
                            validFlag = 0;
                        }
                    }

                    if(validFlag){
                        callback(null, {success: true});
                    } else {
                        callback('Invalid username', null);
                    }
                }
            ],

            add_winners_db: [
                "validate_username_db",
                function(result, callback){
                    let customRecords = [];
                    let counter = 0;
                    for(let prop in userData){
                        customRecords.push([userData[prop].email, userData[prop].username, hackathonID, Object.getOwnPropertyNames(userData)[counter]])
                        counter +=1;
                    }
                    console.log("Custom Records", customRecords)
                    let insertWinnersQuery = `INSERT INTO winner (userEmail, userName, hackathonID, prize) VALUES ?`;

                    dbObj.query(insertWinnersQuery, [customRecords], (err, data) => {
                        if(err){
                            console.log("Error adding winners to DB", err);
                            return callback('Error adding winners to DB', null);
                        }

                        console.log("Winners added successfully!");
                        return callback(null, {success: true, data: data});
                    })
                }
            ]


        }).then((responses) => {
            console.log("Responses", responses);
            return res.status(200).send({success: true, responses});
        }).catch((err) => {
            console.log("Errors", err);
            return res.status(500).send({success: false, errors: err});
        })
    } else {
        return res.status(500).send({success: false, errors: 'Invalid winner ids'});
    }
});

module.exports = announceWinnersRouters;