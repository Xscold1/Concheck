//imports
const mongoose = require('mongoose');
const conn = mongoose.connection;
const bcrypt = require('bcrypt');

//models
const Crew = require('../../models/crew')
const User = require('../../models/user')
const Dtr = require('../../models/dtr')

//utils
const cloudinary = require('../../utils/cloudinary')

//global variables
const saltRounds = 10


const UPDATE_CREW_ACCOUNT_DETAILS = async (req, res) => {
    const session = await conn.startSession();
    try {
        session.startTransaction();

        const uploadImage = await cloudinary.uploader.upload(req.file.path)
        const crewInputInfo = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            address: req.body.address,
            contactNumber: req.body.contactNumber,
        }

        const userAccountDetails = {
            password: req.body.password,
            _id: req.body._id
        }
        const hashPassword = bcrypt.hashSync(userAccountDetails.password, saltRounds)

        const updatePassword = await User.findOneAndUpdate(userAccountDetails._id,{password:hashPassword})

        if(!updatePassword){
            return res.send({
                status: "FAILED",
                statusCode:400,
                response:{
                    messsage: "Failed to update user Account Details"
                }
            })
        }
        
        const updateCrewAccountDetails = await Crew.findOneAndUpdate({userId: userAccountDetails._id}, {$set:{
                ...crewInputInfo,
                imageUrl: uploadImage.url
            }
        }).populate('userId').exec()
        
        if(!updateCrewAccountDetails){
            return res.send({
                status: "FAILED",
                statusCode:400,
                response:{
                    messsage: "Failed to update crew Account Details"
                }
            })
        }

        res.send({
            status: "Success",
            statusCode:200,
            response:{
                messsage: "Successfully Updated Account Details"
            }
        })
    } catch (err) {
        return res.send({
            status: "INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                messsage: err.message
            }
        })
    }
}

const TIMEIN = async (req, res) =>{
    try {
        const {_id} = req.params
        const crewTimeIn = await Dtr.create({timeIn: Date.now(), crewId: _id})
        
        if(!crewTimeIn){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Failed to timein"
                }
            })
        }
        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Successfully log"
            }
        })

    } catch (err) {
        return res.send({
            status: "FAILED",
            statusCode:400,
            response:{
                messsage: "Failed to update user Account Details"
            }
        })
    }
}

const TIMEOUT = async (req, res) =>{
    try {
        const {_id} = req.params
        const crewTimeIn = await Dtr.create({timeOut: Date.now(), crewId: _id})

        if(!crewTimeIn){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Failed to timein"
                }
            })
        }
        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Successfully log"
            }
        })

    } catch (err) {
        return res.send({
            status: "FAILED",
            statusCode:400,
            response:{
                messsage: "Failed to update user Account Details"
            }
        })
    }
}

const COMPUTE_SALARY = async (req, res) => {
    try {
        
    } catch (error) {
        return res.send({
            status: "INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                messsage: err.message
            }
        })
    }
}

const GET_CREW_BY_ID = async (req, res) => {
    try {
        const {_id} = req.params

        const fetchCrewDetails = await Crew.findById(_id).populate('userId')

        res.send({
            status: "SUCCESS",
            statusCode:200,
            response:{
                message:"Successfully fetch data",
                data: fetchCrewDetails
            }
        })
        
    } catch (err) {
        return res.send({
            status: "INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                messsage: err.message
            }
        })
    }
}
module.exports = {
    UPDATE_CREW_ACCOUNT_DETAILS,
    TIMEIN,
    TIMEOUT,
    COMPUTE_SALARY,
    GET_CREW_BY_ID
}