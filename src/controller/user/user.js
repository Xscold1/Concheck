//library
const nodemailer = require("nodemailer");

//utils
const mongoose = require('mongoose');
const conn = mongoose.connection;
const {validatePassword} = require('../../validations/userSchema');
const generateNewPassword = require('../../utils/generatePassword');

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

        if (!checkEmail || checkEmail === undefined || checkEmail === null){
            return res.send({
                status: "FAILED",
                statusCode:404,
                response:{
                    message: "Email or password is incorrect",
                }
            })
        }
        const checkPassword = bcrypt.compareSync(password, checkEmail.password)
        
        if(!checkPassword){
            return res.send({
                status:"ERROR",
                statusCode:400,
                response:{
                    message: "Email or password is incorrect",
                }
            })
        }
        if(checkEmail.roleId === "1" || checkEmail.roleId === 1){

            const adminToken = tokenization.generateToken({id:checkEmail.taskId, roleId:checkEmail.roleId})

            return res.send({
                status:"SUCCESS",
                statusCode:200,
                response:{
                    message: "Successfully log in as admin",
                    data: adminToken,
                    
                }
            })

        }else if(checkEmail.roleId === "2" ||  checkEmail.roleId === 2){

            const fetchCompanyInfo = await Company.findOne({userId:checkEmail.userId })
            const token = tokenization.generateToken({id: fetchCompanyInfo.companyId, roleId:checkEmail.roleId})
            
            return res.send({
                status:"SUCCESS",
                statusCode:200,
                response:{
                    message: "Successfully log in as company",
                    data:token
                }
            })

        }else if(checkEmail.roleId === "3" || checkEmail.roleId === 3){
            const fetchEngineerInfo = await Engineer.findOne({userId:checkEmail.userId })
            
            const token = tokenization.generateToken({ id: fetchEngineerInfo.engineerId, roleId:checkEmail.roleId})
            return res.send({
                status:"SUCCESS",
                statusCode:200,
                response:{
                    message: "Successfully log in as engineer",
                    data: token
                }
            })

        }else if (checkEmail.roleId === "4" || checkEmail.roleId === 4){
            const fetchCrewInfo = await Crew.findOne({userId: checkEmail.userId  })

            const token = tokenization.generateToken({id: fetchCrewInfo.crewId, roleId:checkEmail.roleId})

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
        console.error(error)
        res.send({
            status: "INTERNAL SERVER ERROR",
            statusCode:500,
            message: "An error occurred while logging in",
        })
    }
}

const CHANGE_PASSWORD = async (req, res) => {
    try {

        const {password, newPassword} = req.body
        const {email} = req.params

        const {error, value} = validatePassword.validate({newPassword})

        if(error){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message: error.message
                }
            })
        }

        const findUser = await User.findOne({email: email})

        if(!findUser ||findUser === undefined || findUser === null) {
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message: "User not found"
                }
            })
        }

        const checkPassword = bcrypt.compareSync(password, findUser.password)

        if(!checkPassword) {
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Old password is incorrect"
                }
            })
        }

        const hashPassword = bcrypt.hashSync(value, 10)

        const findAndUpdate = await User.updateOne({email:email}, {$set:{password:hashPassword}})

        res.send({
            status:"OK",
            statusCode:200,
            response:{
                message:"Password Change Successfully"
            }
        })

    } catch (error) {
        console.error(error)
        res.send({
            status: "INTERNAL SERVER ERROR",
            statusCode:500,
            message: "An error occurred while Changing Password",
        })
    }
}

const FORGOT_PASSWORD = async (req, res) => {
    try {
      const { email } = req.body;
  
      // Check if the email exists in the database
      const user = await User.findOne({ email });
      if (!user) {
        return res.send({
            status:"FAILED",
            statusCode:400,
            response:{
                message:"User not found"
            }
        })
      }
  
      // Generate a new password and save it to the database
      const newPassword = generateNewPassword();
      const hashPassword = bcrypt.hashSync(newPassword, 10)
      user.password = hashPassword;
      await user.save();
  
      // Send an email to the user with the new password
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "concheckmailer@gmail.com",
          pass: "kbqvhygysktlqrgq",
        },
      });
  
      const mailOptions = {
        from: "ConCheck@gmail.com",
        to: email,
        subject: "New Password Request",
        text: `Your new password is: ${newPassword}`,
      };
  
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(error);
            return res.send({
                status: "FAILED",
                statusCode:400,
                response:{
                    message: "An error occurred while Changing Password",
                }
            })
        } else {
            return res.send({
                status: "OK",
                statusCode:200,
                response:{
                    message: "New password is sent to email",
                }
            })
        }
      });
    } catch (error) {
        console.error(error);
        res.send({
            status: "INTERNAL SERVER ERROR",
            statusCode:500,
            message: "An error occurred while Changing Password",
        })
    }
};
  

module.exports = {
    LOGIN,
    CHANGE_PASSWORD,
    FORGOT_PASSWORD
}