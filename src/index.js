require('dotenv').config()
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 4400;

const databaseSchemaRouter = require('./routes/database-schema');
const hackathonCreateRouter = require('./routes/hackathon-create-router');
const hackathonGetRouter = require('./routes/hackathon-get-router');
const hackathonRegisterRouter = require('./routes/hackathon-register-router');

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors());

app.use(databaseSchemaRouter);
app.use(hackathonGetRouter);
app.use(hackathonCreateRouter);
app.use(hackathonRegisterRouter);

app.listen(PORT, ()=>{
    console.log(`Hackathon service listening on ${PORT}`);
})

