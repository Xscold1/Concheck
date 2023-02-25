
//import
const mongoose = require('mongoose');
const conn = mongoose.connection;
const bcrypt = require('bcrypt');


//models
const Project = require('../../models/project');
const Image = require('../../models/image');
const Crew = require('../../models/crew');
const User = require('../../models/user');
const Task = require('../../models/task');
const DailyReport = require('../../models/dailyReport');

//utils
const cloudinary = require('../../utils/cloudinary')

//global variables
const saltRounds = 10

const ADD_TASK = async (req, res) => {
    try {
        const {taskName,startDate, endDate, _id} = req.body;
        
        const addTask = await Task.create({
            taskName:taskName,
            startDate:startDate,
            endDate:endDate,
            projectId: _id,
        })
        
        if(!addTask){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Failed to add task"
                }
            })
        }

        res.send({
            status:"SUCCESS",
                statusCode:200,
                response:{
                    message:"Task added successfully"
                }
            })

    } catch (err) {
        res.send({
            status:"INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                message:err.message
            }
        })
    }
}

const GET_ALL_TASK = async (req, res)=>{
    try {
        const {_id} = req.params

        const fetchAlltask = await Task.find({projectId: _id})
        
        
        if(fetchAlltask.length === 0){
            return res.send({
                status:"SUCCESS",
                statusCode:200,
                response:{
                    message:"No task Found"
                }
            })
        }

        if(!fetchAlltask){
            return res.send({
                status:"SUCCESS",
                statusCode:200,
                response:{
                    message:"No task Found"
                }
            })
        }

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Successfully fetched all tasks",
                data: fetchAlltask
            }
        })
    } catch (err) {
        res.send({
            status:"Internal Server Error",
            statusCode:500,
            response:{
                message:err.message
            }
        })
    }
}

const UPLOAD_IMAGE = async (req,res)=>{
    try {
        const {_id} = req.params
        const images = req.files;
        const captions = req.body.caption;
        // Iterate over the uploaded images and captions
        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            const caption = captions[i];
            // Upload the image to Cloudinary

            const result = await cloudinary.uploader.upload(image.path)
        
            // Create a new image document and save it to the database

            const newImage = new Image({
                imageUrl: result.url,
                caption: caption,
                projectId: _id,
                date: Date.now()
            });

            newImage.save()
    }
      
        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Uploaded image successfully"
            }
        })

    } catch (err) {
        res.send({
            status:"Internal Server Error",
            statusCode:500,
            response:{
                message:err.message
            }
        })
    }
}

const GET_PROJECT_BY_ID = async (req, res) => {
    try {
        const {_id} = req.params

        const fetchProjectDetails = await Project.findById(_id)

        if(!fetchProjectDetails) {
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Project not found"
                }
            })
        }

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Fetch Successfully",
                data:fetchProjectDetails
            }
        })
    } catch (err) {
        res.send({
            status:"Internal Server Error",
            statusCode:500,
            response:{
                message:err.message
            }
        })
    }
}

const ADD_DAILY_REPORT = async (req,res)=>{
    try {
        const {remarks, weatherReport, causeOfDelay, hoursDelay, _id} = req.body

        const insertDailyReport = await DailyReport.create({
            remarks:remarks,
            weatherReport:weatherReport,
            causeOfDelay:causeOfDelay,
            hoursDelay:hoursDelay,
            projectId: _id,

        })

        if(!insertDailyReport){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Failed to insert daily report"
                }
            })
        }

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Inserted daily report successfully"
            }
        })

    } catch (err) {
        res.send({
            status:"Internal Server Error",
            statusCode:500,
            response:{
                message:err.message
            }
        })
    }
}

const ADD_CREW_ACCOUNT = async (req, res) => {
    const session = await conn.startSession()
    try {

        session.startTransaction()
        const {_id} = req.params
        const {email , password , rate, startShift, endShift} = req.body

        const checkEmailIfExists = await User.findOne({email:email})
        if(checkEmailIfExists){
            return res.send({
                status: "FAILED",
                statusCode:400,
                response:{
                    messsage: "Email Already Exists"
                }
            })
        }

        
        const hashPassword = bcrypt.hashSync(password, saltRounds)

        const createCrewUserAccount = await User.create([{
            email:email, 
            password:hashPassword, 
            roleId:"4"
        }], {session})

        if(!createCrewUserAccount){
            return res.send({
                status: "FAILED",
                statusCode:400,
                response:{
                    messsage: "Failed to create account"
                }
            })
        }

        let id = createCrewUserAccount.map(a => a._id)

        const createCrewAccount = await Crew.create([{
            rate:rate,
            startShift:startShift,
            endShift:endShift,
            userId:id[0],
            projectId:_id
        }], {session})

        if(!createCrewAccount){
            return res.send({
                status: "FAILED",
                statusCode:400,
                response:{
                    messsage: "Failed to create account"
                }
            })
        }

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Account created Successfully"
            }
        })
        session.commitTransaction()
    } catch (err) {
        res.send({
            status: "INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                messsage: err.message
            }
        })
        await session.abortTransaction()
    }
    session.endSession
}

const GET_ALL_CREW_BY_PROJECT = async (req, res) => {
    try {
        const {_id} = req.params
        const fetchAllCrew = await Crew.find({projectId:_id}).populate('userId').exec()

        if(fetchAllCrew.length === 0 ){
            return res.send({
                status:"SUCCESS",
                statusCode:200,
                response:{
                    message:"No Crew Found"
                }
            })
        }
        if(!fetchAllCrew){
            return res.send({
                status:"Failed",
                statusCode:400,
                response:{
                    message:"Failed to get crew details"
                }
            })
        }

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Successfully fetched all tasks",
                data: fetchAllCrew
            }
        })
    } catch (err) {
        res.send({
            status:"Internal Server Error",
            statusCode:500,
            response:{
                message:err.message
            }
        })
    }
}

const GET_DAILY_REPORT_BY_ID = async (req, res) => {
    try {
        const {_id} = req.params
        const fetchDailyReport = await DailyReport.find({_id}).populate('taskId').exec()

        if(!fetchDailyReport){
            return res.send({
                status:"Failed",
                statusCode:400,
                response:{
                    message:"Failed to fetch daily report"
                }
            })
        }

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Successfully fetched all tasks",
                data: fetchDailyReport
            }
        })
    } catch (err) {
        res.send({
            status:"Internal Server Error",
            statusCode:500,
            response:{
                message:err.message
            }
        })
    }
}
module.exports = {
    ADD_TASK,
    ADD_CREW_ACCOUNT,
    ADD_DAILY_REPORT,
    UPLOAD_IMAGE,
    GET_ALL_TASK,
    GET_PROJECT_BY_ID,
    GET_ALL_CREW_BY_PROJECT,
    GET_DAILY_REPORT_BY_ID
}