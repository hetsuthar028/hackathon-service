const express = require('express');
const validateRequest = require('../middlewares/validate-request');

const hackathonRouter = express.Router();

let path = {
    getUpcomingHackathon: "/api/hackathon/getUpcomingHackathon",
    getAllHackathons: ""
}

hackathonRouter.get(`${path["getUpcomingHackathon"]}`, validateRequest, (req, res)=>{
    console.log(req.headers.authorization);
    res.send({});
});

module.exports = hackathonRouter;
