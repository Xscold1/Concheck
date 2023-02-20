
//utils
const mongoose = require('mongoose');
const conn = mongoose.connection;
//const status = require('../constant/statusCode');

//models
const User = require('../../models/user');
const Engineer = require('../../models/company');
const Company = require('../../models/company');
const Crew = require('../../models/crew');


// const REGISTER_USER = async (req, res) => {
//     const session = await conn.startSession();
//     try {
//         session.startTransaction();

//         const {firstName, lastName, email, password, age, roleId, licenseNumber, address,} = req.body;
//         //check if email already exists
//         const checkSameEmail = await User.findOne({email: email}).exec();

//         if(checkSameEmail){
//             return res.send({
//                 status: "success",
//                 statusCode: 200,
//                 message: "Email already exists",
//             });
//         }
//         const registerUser = await User.create([{email: email, password: password, roleId: roleId, }], { session })

//         if(!registerUser){
//             return res.send({
//                 status: "Failed",
//                 statusCode: 400,
//                 response:{
//                     message: "Something went wrong"
//                 }
//             })
//         };
//         let result = registerUser.map(a => a._id)
//         const registerEngineer = await Engineer.create([{firstName: firstName, lastName: lastName, age: age, address: address, licenseNumber: licenseNumber, userId: result[0]}], { session })

//         if(!registerEngineer){
//             return res.send({
//                 status: "Failed",
//                 statusCode: 400,
//                 response:{
//                     message: "Something went wrong"
//                 }
//             })
//         };

//         res.send({
//             status: "success",
//             statusCode: 200,
//             message: "Successfully registered",
//         })
//         await session.commitTransaction();
//     } catch (err) {
//         res.send({
//             status: "INTERNAL SERVER ERROR",
//             statusCode:500,
//             message: err.message,
//         })
//         await session.abortTransaction();
//     }
//     session.endSession();
// }
const LOGIN = async (req, res) => {
    try {
        const {email, password} = req.body

        const checkEmail = await User.findOne({email: email}).exec()
        if (!checkEmail){
            return res.send({
                status: "FAILED",
                statusCode:404,
                response:{
                    message: "User or password is incorrect",
                }
            })
        }
        if(checkEmail.roleId === "2"){
            const loginAsCompany = await Company.findOne({userId: checkEmail.id}).exec()

        }else if(checkEmail.roleId === "3"){

            const getEngineer = await Engineer.findOne({userId: checkEmail.id}).exec()

        }else if (checkEmail.roleId === "4"){


        }
        
        if(password !== checkEmail.password){
            return res.send({
                status: "FAILED",
                statusCode:404,
                response:{
                    message: "User or password is incorrect",
                }
            })
        }

        if(checkEmail.roleId === "1"){
            return res.send({
                status: "SUCCESS",
                statusCode: 200,
                response:{
                    message: "Successfully Login as Administrator",
                    data: {
                        email: checkEmail.email,
                        roleId: checkEmail.roleId    
                    }
                }
            })
        }

        else if(checkEmail.roleId === "2"){
            return res.send({
                status: "SUCCESS",
                statusCode: 200,
                response:{
                    message: "Successfully Login as Project Owner",
                    data:{

                    }
                }
            })
        }

        else if(checkEmail.roleId === "3"){
            return res.send({
                status: "success",
                statusCode: 200,
                response:{
                    message: "Successfully Login as Project Engineer",
                    data:{
                        id: checkEmail.id,
                        firstName:getUser.firstName,
                        lastName:getUser.lastName,
                        age:getUser.age,
                        email:checkEmail.email,
                        password:checkEmail.password,
                        address:getUser.address,
                        licenseNumber:getUser.licenseNumber,
                        roleId:checkEmail.roleId,
                        
                    }
                    
                }
            })
        }

        else if(checkEmail.roleId === "4"){
            return res.send({
                status: "success",
                statusCode: 200,
                response:{
                    message: "Successfully Login as Crew",
                    data:""
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


const LOGOUT = async (req, res)=>{
    try {
        
    } catch (err) {
        
    }
}
module.exports = {
    //REGISTER_USER,
    LOGIN,
    DELETE_USER,
    LOGOUT

}