
//utils
const mongoose = require('mongoose');
const conn = mongoose.connection;
const bcrypt = require('bcrypt');

//models
const Project = require('../../models/project');
const Crew = require('../../models/crew');
const User = require('../../models/user');
const Task = require('../../models/task');
const DailyReport = require('../../models/dailyReport');

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
        const fetchAlltask = await Task.find()

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

module.exports = {
    ADD_TASK,
    ADD_CREW_ACCOUNT,
    ADD_DAILY_REPORT,
    UPLOAD_IMAGE,
    GET_ALL_TASK
}