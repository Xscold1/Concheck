//utils
const mongoose = require('mongoose');
const conn = mongoose.connection;

//models crew
const Crew = require('../../models/crew')
const User = require('../../models/user')

const UPDATE_CREW_ACCOUNT_DETAILS = async (req, res) => {
    try {
        const {image, firstName, lastName ,password, address, contacNumber, _id} = req.body

        const updateCrewAccountDetails = await Crew.findOneAndUpdate({
            _id
        }.populate('userId'), {
            $set:{
                image:image,
                firstName:firstName,
                lastName:lastName,
                password:password,
                address:address,
                contacNumber:contacNumber
            }
        })
        
        if(!updateCrewAccountDetails){
            return res.send({
                status: "FAILED",
                statusCode:400,
                response:{
                    messsage: "Failed to update Account Details"
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

const TIMEIN_TIMEOUT = async (req, res) => {
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

module.exports = {
    UPDATE_CREW_ACCOUNT_DETAILS,
    TIMEIN_TIMEOUT,
    COMPUTE_SALARY
}