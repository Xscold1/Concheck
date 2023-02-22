
//utils
const mongoose = require('mongoose');
const conn = mongoose.connection;
//const status = require('../constant/statusCode');
const bcrypt = require('bcrypt');

//models
const User = require('../../models/user');
const Engineer = require('../../models/engineer');
const Company = require('../../models/company');
const Crew = require('../../models/crew');

const LOGIN = async (req, res) => {
    try {
        const {email, password} = req.body

        const checkEmail = await User.findOne({email: email}).exec()

        if (!checkEmail){
            return res.send({
                status: "FAILED",
                statusCode:404,
                response:{
                    message: "Email or password is incorrect",
                }
            })
        }
        const checkPassowrd = await bcrypt.compareSync(password, checkEmail.password)

        if(!checkPassowrd){
            return res.send({
                status:"ERROR",
                statusCode:400,
                response:{
                    message: "Email or password is incorrect",
                }
            })
        }
        if(checkEmail.roleId === "1"){
            return res.send({
                status:"SUCCESS",
                statusCode:200,
                response:{
                    message: "Successfully log in as admin",
                    data: checkEmail
                }
            })
        }else if(checkEmail.roleId === "2"){
            const fetchCompanyInfo = await Company.findOne({userId:checkEmail._id }).populate('userId').exec()
            
            return res.send({
                status:"SUCCESS",
                statusCode:200,
                response:{
                    message: "Successfully log in as company",
                    data: fetchCompanyInfo
                }
            })

        }else if(checkEmail.roleId === "3"){
            const fetchEngineerInfo = await Engineer.findOne({userId:checkEmail._id  }).populate('userId').exec()

            return res.send({
                status:"SUCCESS",
                statusCode:200,
                response:{
                    message: "Successfully log in as engineer",
                    data: fetchEngineerInfo
                }
            })

        }else if (checkEmail.roleId === "4"){
            const fetchCrewInfo = await Crew.findOne({userId:checkEmail._id  }).populate('userId').exec()
            return res.send({
                status:"SUCCESS",
                statusCode:200,
                response:{
                    message: "Successfully log in as crew",
                    data:fetchCrewInfo
                }
            })

        }
        
    } catch (err) {
        res.send({
            status: "INTERNAL SERVER ERROR",
            statusCode:500,
            message: err.message,
        })
    }
}

const DELETE_USER = async (req, res) => {
    try {
        const {email} = req.body;

        const checkEmail = await User.findOne({ email:email });

        if (!checkEmail){
            return res.send({
                status:"ERROR",
                statusCode:400,
                response:{
                    message: "User not found",
                }
            })
        }

        const deleteUser = await User.delete({ email:email})

        if(!deleteUser){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message: "Failed to delete user",
                }
            })
        }

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message: "User deleted successfully"
            }
        })

    } catch (err) {
         res.send({
            status: "INTERNAL SERVER ERROR",
            statusCode:500,
            message: err.message,
        })
    }
}
module.exports = {
    //REGISTER_USER,
    LOGIN,
    DELETE_USER,

}