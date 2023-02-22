
//utils
const mongoose = require('mongoose');
const conn = mongoose.connection;
const bcrypt = require('bcrypt');

//models
const Project = require('../../models/project');
const Crew = require('../../models/crew');
const User = require('../../models/user');
//global variables
const saltRounds = 10

const ADD_TASK = async (req, res) => {
    try {
        
    } catch (err) {
        
    }
}

const GET_ALL_TASK = async (req, res)=>{
    try {
        
    } catch (error) {
        
    }
}

const UPLOAD_IMAGE = async (req,res)=>{
    try {
        
    } catch (error) {
        
    }
}

const DAILY_REPORT = async (req,res)=>{
    try {
        
    } catch (error) {
        
    }
}

const ADD_CREW_ACCOUNT = async (req, res) => {
    const session = await conn.startSession()
    try {

        session.startTransaction()

        const {email , password , rate, startShift, endShift, roleId} = req.body

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
            roleId:roleId
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
    DAILY_REPORT,
    UPLOAD_IMAGE,
    GET_ALL_TASK
}