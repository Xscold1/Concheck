//models
const Engineer = require('../../models/engineer');
const Company = require('../../models/company');
const User = require('../../models/user');

//utils
const cloudinary = require('../../utils/cloudinary')

//import
const mongoose = require('mongoose');
const conn = mongoose.connection;


//global variables
const bcrypt = require('bcrypt');
const saltRounds = 10


const ADD_ENGINEER_ACCOUNT = async (req, res) => {

    const session = await conn.startSession();
    try {
        session.startTransaction();
        const {companyUserId} = req.params
        const userAccountInput = {
            email: req.body.email,
            password: req.body.password
        } 

        const engineerAccountInput = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            licenseNumber: req.body.licenseNumber,
            address: req.body.address
        }
        const uploadImage = await cloudinary.uploader.upload(req.file.path)

        const checkEmailIfExists = await User.findOne({email: userAccountInput.email})
        .catch((error) =>{
            throw new Error("Failed to find user account");
        })
        
        if(checkEmailIfExists) {
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Email already exists"
                }
            })
        }

        const hashPassword = bcrypt.hashSync(userAccountInput.password, saltRounds)

        const registerUser = await User.create([{
            email: userAccountInput.email, 
            password: hashPassword, 
            roleId: "3",
            
        }], { session })
        .catch((error) =>{
            throw new Error("Failed to create engineer account");
        })

        let result = registerUser.map(a => a._id)

        await Engineer.create([{
            ...engineerAccountInput,
            imageUrl: uploadImage.url, 
            userId: result[0],
            companyId: companyUserId
        }], { session })
        .catch((error) =>{
            throw new Error("Failed to create engineer account");
        })

        res.send({
            status: "success",
            statusCode: 200,
            response:{
                message: "Account created successfully",
            }
        })
        await session.commitTransaction();
    } catch (error) {
        console.error(error);
        res.send({
                status:"INTERNAL SERVER ERROR",
                statusCode:500,
                response:{
                    message: "Failed to create engineer account"
                }
            })
        await session.abortTransaction();
    }
    session.endSession();
}

const GET_ALL_ENGINEER_ACCOUNT_BY_COMPANY = async (req, res)=>{
    try {
        const {companyUserId} = req.params
        const fetchAllEngineerData = await Engineer.find({companyId:companyUserId}).populate('userId')
        .catch((error) =>{
            throw new Error("Failed to find engineer account");
        })

        if (!fetchAllEngineerData) {
            return res.send({
                status:"SUCCESS",
                statusCode:200,
                response:{
                    message:"There is no Engineer account yet"
                }
            })
        }

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Fetch all companies account successfully",
                data:fetchAllEngineerData
            }
        })
    } catch (error) {
        console.error(error)
        return res.send({
            status:"INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                message: "Failed to find engineer account"
            }
        })
    }
}

const GET_ENGINEER_ACCOUNT_BY_ID = async (req,res) => {
    try {
        const {engineerUserId} = req.params
        const findEngineerAccount = await Engineer.findOne({userId:engineerUserId}).populate('userId')
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to find engineer account");
        })

        if(!findEngineerAccount) {
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Account does not exist"
                }
            })
        }

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Fetch Successfully",
                data:findEngineerAccount
            }
        })

    } catch (error) {
        console.error(error);
        return res.send({
            status:"INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                message:"Failed to find engineer account"
            }
        })
    }
}

const EDIT_ENGINEER_ACCOUNT = async (req, res)=>{
    const session = await conn.startSession()
    try {
        session.startTransaction()
        const {engineerUserId} = req.params
        const userAccountInput = {
            password: req.body.password,
        } 

        const engineerAccountInput = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            licenseNumber: req.body.licenseNumber,
            address: req.body.address
        }

        const hashPassword = bcrypt.hashSync(userAccountInput.password, saltRounds)
        
        const updateEngineerUserAccount = await User.findByIdAndUpdate(engineerUserId, [{
            $set:{ 
                password: hashPassword
            }}], {session})
            .catch((error) =>{
                console.error(error);
                throw new Error("Failed to find engineer account");
            })
        
        if(!updateEngineerUserAccount){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Failed to Update Account"
                }
            })
        }

        if(!req.file){
            await Engineer.findOneAndUpdate({
                userId: updateEngineerUserAccount._id
                },[{$set: {
                    ...engineerAccountInput,
                }}], {session})
            .catch((error) =>{
                console.error(error);
                throw new Error("Failed to find engineer account");
            })
           return res.send({
                status:"SUCCESS",
                statusCode:200,
                response:{
                    message:"Account Updated Successfully"
                }
            })
        }
        
        const uploadImage = await cloudinary.uploader.upload(req.file.path)
            await Engineer.findOneAndUpdate({
                userId: updateEngineerUserAccount._id
                },[{$set: {
                    ...engineerAccountInput,
                    imageUrl: uploadImage.url
                }}], {session})
            .catch((error) =>{
                console.error(error);
                throw new Error("Failed to find engineer account");
            })
        

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Account Updated Successfully"
            }
        })
        await session.commitTransaction();

    } catch (error) {
        console.error(error);
        res.send({
            status:"INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                message:"Failed to find engineer account"
            }
        })
        await session.abortTransaction();
    }
    session.endSession();
}


module.exports = {
    ADD_ENGINEER_ACCOUNT,
    EDIT_ENGINEER_ACCOUNT,
    GET_ALL_ENGINEER_ACCOUNT_BY_COMPANY,
    GET_ENGINEER_ACCOUNT_BY_ID
}