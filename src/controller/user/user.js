
//utils
const mongoose = require('mongoose');
const conn = mongoose.connection;
//const status = require('../constant/statusCode');
const bcrypt = require('bcrypt');
const tokenization = require('../../utils/token');

//models
const User = require('../../models/user');
const Engineer = require('../../models/engineer');
const Company = require('../../models/company');
const Crew = require('../../models/crew');

const LOGIN = async (req, res) => {
    try {
        const {email, password} = req.body

        const checkEmail = await User.findOne({email: email})
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to create Crew account");
        })

        if (!checkEmail){
            return res.send({
                status: "FAILED",
                statusCode:404,
                response:{
                    message: "Email or password is incorrect",
                }
            })
        }
        const checkPassowrd = bcrypt.compareSync(password, checkEmail.password)

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

            const adminToken = tokenization.generateToken({_id:checkEmail._id, roleId:checkEmail.roleId})

            return res.send({
                status:"SUCCESS",
                statusCode:200,
                response:{
                    message: "Successfully log in as admin",
                    data: adminToken,
                    
                }
            })

        }else if(checkEmail.roleId === "2"){

            const fetchCompanyInfo = await Company.findOne({userId:checkEmail._id }).populate('userId')
            .catch((error) =>{
                console.error(error);
                throw new Error("Error in Fiding Dtr Record");
            })
            const token = tokenization.generateToken({_id:checkEmail._id, roleId:checkEmail.roleId, firstName: fetchCompanyInfo.firstName, companyId: fetchCompanyInfo._id})
            
            return res.send({
                status:"SUCCESS",
                statusCode:200,
                response:{
                    message: "Successfully log in as company",
                    data:token
                }
            })

        }else if(checkEmail.roleId === "3"){
            const fetchEngineerInfo = await Engineer.findOne({userId:checkEmail._id  }).populate('userId')
            .catch((error) =>{
                console.error(error);
                throw new Error("Error in Fiding Dtr Record");
            })
            const token = tokenization.generateToken({_id:checkEmail._id, roleId:checkEmail.roleId, firstName: fetchEngineerInfo.firstName, EngineerId: fetchEngineerInfo._id})
            return res.send({
                status:"SUCCESS",
                statusCode:200,
                response:{
                    message: "Successfully log in as engineer",
                    data: token
                }
            })

        }else if (checkEmail.roleId === "4"){
            const fetchCrewInfo = await Crew.findOne({userId:checkEmail._id  }).populate('userId')
            .catch((error) =>{
                console.error(error);
                throw new Error("Error in Fiding Dtr Record");
            })
            const token = tokenization.generateToken({_id:fetchCrewInfo._id, roleId:checkEmail.roleId, firstName: fetchCrewInfo.firstName, crewId: fetchCrewInfo._id,})

            return res.send({
                status:"SUCCESS",
                statusCode:200,
                response:{
                    message: "Successfully log in as crew",
                    data:token
                }
            })

        }
        
    } catch (error) {
        res.send({
            status: "INTERNAL SERVER ERROR",
            statusCode:500,
            message: err.message,
        })
    }
}


module.exports = {
    LOGIN,
}