const express = require("express");
const dbObj = require("../utils/database-obj");
const requireLogin = require("../middlewares/require-login");
const validateOrg = require("../middlewares/validate-org");
const { v4: uuid4, validate } = require("uuid");
const async = require("async");
const hackathonCreateRouter = express.Router();
const axios = require('axios');
const concat = require("concat-stream")

const firebaseConfig = require('../../FirebaseConfig');

const firebaseApp = require('firebase/app');
firebaseApp.initializeApp(firebaseConfig)

const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const storage = getStorage();
const path = require('path');

const fs = require('fs');
const csv = require('csv-parser');
const csvResults = [];
const multer  = require('multer')
// const upload = multer({ dest: 'uploads/' })
const readXlsxFile = require('read-excel-file/node');

const storageMulter = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },

    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storageMulter })

var FormData = require('form-data');

let filename = "C://Users/hetme/Desktop/Sem 7.png"
let fileData;

const metadata = {
    contentType: 'image/jpeg',
};

const paths = {
    createHackathon: "/api/hackathon/create",
    uploadFilePath: "/api/hackathon/upload",
    tempUpload: "/api/hackathon/tempUpload",
    uploadSliderImage: "/api/hackathon/upload/imagetostorage",
    parseExcel: "/api/hackathon/parse/excel",
    uploadSubmission: "/api/hackathon/upload/submission/storage"
};

hackathonCreateRouter.post(
    `${paths["createHackathon"]}`,
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
                                organiserEmail,
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
                                sliders,
                            } = req.body;
                            console.log("Slider", sliders);
                            if (
                                hackTitle &&
                                hackDescription &&
                                hackCompanyName &&
                                organiserEmail &&
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
                                sliders.length !=0 &&
                                problemStatements.length != 0
                            ) {
                                let validProbStatements = 1;
                                let validSponsors = 1;
                                let validSliders = 1;
    
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
    
                                        if (sponsorName && sponsorWebLink) {
                                            // Valid
                                        } else {
                                            validSponsors = 0;
                                            // callback("Invalid Inputs 2", null);
                                            return;
                                        }
                                    });
                                }

                                sliders.forEach((slider) => {
                                    let { sliderTitle, sliderSubtitle, sliderImage } = slider;

                                    if( slider.sliderTitle && slider.sliderSubtitle ){
                                        // Pass
                                    } else {
                                        console.log("Inv Slider", slider);
                                        validSliders = 0;
                                        callback("Invalid slider data", null)
                                        return;
                                    }
                                })
    
                                if (validProbStatements && validSponsors && validSliders) {
                                    return callback(null, "valid");
                                } else {
                                    console.log(validProbStatements, validSponsors, validSliders)
                                    callback("Invalid Inputs 3", null);
                                    return;
                                }
                            } else {
                                callback("Invalid Inputs 4", null);
                                return;
                            }
                        }
                        catch(err) {
                            console.log("At 178", err);
                            // callback("Invalid Inputs 5", null);
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
                            organiserEmail,
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
                        let addHackathonQuery = `INSERT INTO hackathon(id, title, description, organiserEmail, organizedBy, regStart, regEnd, hackStart, hackEnd, maxParticipants, submissionFormats, submissionGuidelines, facebook, instagram, twitter, linkedin, firstPrizeDesc, secondPrizeDesc, thirdPrizeDesc) 
                                                VALUES('${uniqueHackathonID}', '${hackTitle}', '${hackDescription}', '${organiserEmail}', '${hackCompanyName}', STR_TO_DATE("${regStart}","%d-%m-%Y"), STR_TO_DATE("${regEnd}","%d-%m-%Y"), STR_TO_DATE("${hackStart}","%d-%m-%Y"), STR_TO_DATE("${hackEnd}","%d-%m-%Y"), ${totalApplications}, '${submissionFormats}', '${submissionGuidelines}', '${facebook}', '${instagram}', '${twitter}', '${linkedIn}', '${firstPrizeDesc}', '${secondPrizeDesc}', '${thirdPrizeDesc}')`;

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

                upload_sponsors_img_storage: [
                    "add_hackathon_db",
                    function(result, callback){
                        let { localUploadedSponsorsFilesPath } = req.body;
                        console.log("Local Sponsor Path", localUploadedSponsorsFilesPath)
                        axios.post('http://localhost:4400/api/hackathon/upload/imagetostorage', {
                            localUploadedFilesPath: localUploadedSponsorsFilesPath,
                            location: "hackathons/sponsors/"
                        }).then((resp) => {
                            callback(null, { urls: resp.data.fileUrls })
                        }).catch((err) => {
                            callback('Error uploading sponsor images', null);
                        })
                    }
                ],

                // Add sponsors into DB
                add_sponsors_db: [
                    "upload_sponsors_img_storage",
                    function (result, callback) {
                        let uniqueHackathonID =
                            result.add_hackathon_db.uniqueHackathonID;

                        let prevLinks = result.upload_sponsors_img_storage.urls;
                        console.log("Prev Links 2", prevLinks);
                        let {
                            sponsors,
                        } = req.body;

                        // async
                        //     .auto({
                        //         add_sponsors: function (callback) {
                        sponsors.forEach((sponsor, idx) => {
                            let sponsorID = uuid4();
                            let addSponsorQuery = `INSERT INTO sponsor(id, hackathonID, name, imageLink, webLink) VALUES('${sponsorID}', '${uniqueHackathonID}', '${sponsor.sponsorName}', '${prevLinks[idx]}', '${sponsor.sponsorWebLink}')`;

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
                ],

                upload_sliders_img_storage: [
                    "add_problem_statements_db",
                    function(result, callback){
                        let { localUploadedSlidersFilesPath } = req.body
                        axios.post('http://localhost:4400/api/hackathon/upload/imagetostorage', {
                            localUploadedFilesPath: localUploadedSlidersFilesPath,
                            location: "hackathons/posters/"
                        }).then((resp) => {
                            callback(null, {urls: resp.data.fileUrls});
                        }).catch((err) => {
                            callback('Error uploading slider images', null);
                        })
                    }
                ],

                add_sliders_db: [
                    "upload_sliders_img_storage",
                    function(result, callback){
                        let prevLinks = result.upload_sliders_img_storage.urls;
                        console.log("Prev Links", prevLinks)
                        let uniqueHackathonID = result.add_hackathon_db.uniqueHackathonID;
                        let {sliders} = req.body;

                        sliders.map((slider, idx) => {
                            let sliderId = uuid4();
                            let insertSliderQuery = `INSERT INTO slider(id, title, subtitle, imagePath, hackathonID) 
                                                    VALUES('${sliderId}', '${slider.sliderTitle}', '${slider.sliderSubtitle}', '${prevLinks[idx]}', '${uniqueHackathonID}')`;

                            dbObj.query(insertSliderQuery, (err, data) => {
                                if(err){
                                    console.log("Error adding slider data to DB");
                                    callback("Error adding slider data to DB", null)
                                }

                                console.log("Slider data added successfully")
                                
                            })
                        })
                        callback(null, "Sliders added")
                    }
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


hackathonCreateRouter.post(`${paths["uploadSliderImage"]}`, (req, res)=> {
    let { localUploadedFilesPath, location } = req.body
    let fileUrls = []
    let allFileData = [];


    localUploadedFilesPath.map(async (imgPath, idx) => {
        console.log("Inside map", idx)

        const storageRef = ref(storage, `${location}${uuid4()}.png`);
        console.log("Inside map(1)", idx)

        let data = fs.readFileSync( imgPath );
        console.log("File read")
        await uploadBytes(storageRef, data, metadata).then(async (snapshot) => {
            console.log('Uploaded a blob or file!')
            await getDownloadURL(storageRef).then((url) => {
                console.log("URL", url);
                fileUrls.push(url);
            }).catch((err) => {
                console.log("ERR2: ", err);
            })

        })

        console.log("Outside")
        if(localUploadedFilesPath.length == fileUrls.length){
            console.log("Sent Links");
            return res.status(200).send({success: true, fileUrls: fileUrls});
        }
        
    });

    console.log("Outside")
})

hackathonCreateRouter.post(`${paths["uploadFilePath"]}`, upload.single('userImage'), (req, res) => {

    // images/mountains.jpg
    const storageRef = ref(storage, `hackathons/posters/${uuid4()}.jpg`);

    console.log("Request File", req.file)

});

hackathonCreateRouter.post(`${paths["tempUpload"]}`, upload.array("userImage", 10), (req, res) => {
    // let { sliders } = req.body;
    console.log("Image Files::", req.files);

    let filePaths = []

    req.files.map((f) => {
        filePaths.push(f.path);
    })

    return res.status(200).send({success: true, filePaths: filePaths})
});

hackathonCreateRouter.post(`${paths["parseExcel"]}`, (req, res) => {
    let { filePath } = req.body;

    const schema = {
        'Title': {
          // JSON object property name.
          prop: 'probTitle',
          type: String,
          required: true
        },
        'Description': {
          prop: 'probDescription',
          type: String,
          required: true
        },
        'Solution Type': {
            prop: 'probSolutionType',
            type: String,
            oneOf: [
              'Mobile-Android App',
              'Web Application',
              'Desktop Application',
              'Console Application',
            ],
            required: true
        },    
        'Accepted Technologies': {
            prop: 'probAcceptedTechs',
            type: String,
            required: true,
        },
        'Reference Links':{
            prop: 'probRefLinks',
            type: String,
            required: true
        },
    }

    readXlsxFile(path.join(__dirname, `../../${filePath}`), {schema}).then(({rows, errors}) => {
        if(errors.length !=0){
            console.log("Excel Parsing Errors", rows);
            return res.status(500).send({success: false, errors: errors});
        }
        console.log("Excel Parsed Data", rows);
        res.status(200).send({success: true, parsedData: rows});
        return res.end();
    })

});

hackathonCreateRouter.post(`${paths["uploadSubmission"]}`, (req, res) => {
    let { filePath, userEmail, hackathonID, problemStatementID } = req.body;
    console.log("Req Data", req.body);

    async.auto({
        check_user_prev_submission_status: 
            function(callback){
                const existingUserSubmissionQuery = `SELECT * FROM submission WHERE userEmail='${userEmail}' AND hackathonID='${hackathonID}'`
                dbObj.query(existingUserSubmissionQuery, (err, data) => {
                    if(err){
                        console.log("Error checking user's prev submissions", err);
                        return callback(err, null);
                    }

                    if(data.length == 1){
                        return callback('User has already submitted', null);
                    } else {
                        return callback(null, {success: true});
                    }
                })
                
        },

        upload_submission_storage:[
            "check_user_prev_submission_status",
                function(result, callback){
                    console.log("Submission File Extension", path.extname(filePath));

                    const submissionStorageRef = ref(storage, `/hackathons/submissions/${uuid4()}${path.extname(filePath)}`)

                    let data = fs.readFileSync(filePath);

                    uploadBytes(submissionStorageRef, data).then(async (snapshot) => {
                        console.log("Uploaded Submission File!");

                        await getDownloadURL(submissionStorageRef).then((url) => {
                            console.log("File URL", url);
                            return callback(null, {success: true, downloadURL: url})
                        }).catch((err) => {
                            return callback(err, null);
                        })
                    }).catch((err) => {
                        return callback(err, null);
                    })      
            }
        ],

        set_submission_db: [
            "upload_submission_storage",
            function(result, callback){
                let {downloadURL} = result.upload_submission_storage;
                console.log("Download URL", result.upload_submission_storage.downloadURL);
                let submissionID = uuid4();
                let submitSolutionQuery = `INSERT INTO submission(id, userEmail, hackathonID, problemStatID, submissionLink) VALUES('${submissionID}', '${userEmail}', '${hackathonID}', '${problemStatementID}', '${downloadURL}')`;

                dbObj.query(submitSolutionQuery, (err, data) => {
                    if(err){
                        console.log("Error adding submission to db", err);
                        return callback(err, null);
                    }

                    return callback(null, {success: true, data: data});
                })
            }
        ]
    }).then((responses) => {
        return res.status(200).send({success: true, responses})
    }).catch((err) => {
        return res.status(500).send({success: false, errors: err});
    })
})


module.exports = hackathonCreateRouter;
