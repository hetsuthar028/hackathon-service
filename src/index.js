require('dotenv').config()
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 4400;

const databaseSchemaRouter = require('./routes/database-schema');
const hackathonRouter = require('./routes/hackathon-router');

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors());

app.use(databaseSchemaRouter);
app.use(hackathonRouter);

app.listen(PORT, ()=>{
    console.log(`Hackathon service listening on ${PORT}`);
})

