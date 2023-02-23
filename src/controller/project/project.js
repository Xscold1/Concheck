
//import
const mongoose = require('mongoose');
const conn = mongoose.connection;
const bcrypt = require('bcrypt');
const fs = require('fs');

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
        const {_id}= req.params

        const url = []
        const files = req.files

        const uploader = async (path)  => await cloudinary.uploads(path, 'Images')

        for(const file of files){
            const {path} = file;
            const newPath = await uploader (path)
            url.push(newPath)
            fs.unlinkSync(path)
        }

        const addMultipleImage = await Image.create({
            projectId:_id,
        })

        if(!addMultipleImage) {
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Failed to upload image"
                }
            })
        }

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Image successfully uploaded"
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

const FIND_IMAGE_AND_UPDATE_CAPTION = async (req,res) => {
    try {
        const {_id} = req.params
        const {caption} = req.body

        const findImageAndUpdate = await Image.findByIdAndUpdatey(_id, {caption:caption, date: Date.now()})
        
        if(!findImageAndUpdate){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Failed to update Image"
                }
            })
        }

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Successsfully updated image",
                data:findImageAndUpdate
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
            userId:id[0]
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

const GET_ALL_CREW = async (req, res) => {
    try {
        const fetchAllCrew = await Crew.find({roleId:"4"}).populate('userId').exec()

        if(!fetchAllCrew){
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
module.exports = {
    ADD_TASK,
    ADD_CREW_ACCOUNT,
    ADD_DAILY_REPORT,
    UPLOAD_IMAGE,
    GET_ALL_TASK,
    FIND_IMAGE_AND_UPDATE_CAPTION,
    GET_PROJECT_BY_ID,
    GET_ALL_CREW
}