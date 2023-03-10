//models
const User = require('../../models/user')
const Company = require('../../models/company')
const Engineer = require('../../models/engineer')
const Crew = require('../../models/crew')
const Project = require('../../models/project')
const Task = require('../../models/task')
const Image = require('../../models/image')
const Dtr = require('../../models/dtr')
const dailyReport = require('../../models/dailyReport')


//utils
const cloudinary = require('../../utils/cloudinary')
const {userSchema, engineerDetailsSchema} = require('../../validations/userSchema');

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
        const {companyId} = req.params

        const userAccountInput = {
            email: req.body.email,
            password: req.body.password
        } 

        try {
            await userSchema.validateAsync(userAccountInput)
        } catch (error) {
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:error.message
                }
            })
        }

        const engineerAccountInput = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            licenseNumber: req.body.licenseNumber,
            address: req.body.address
        }

        const {error} = engineerDetailsSchema.validate(engineerAccountInput)
        if(error){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:error.message
                }
            })
        }

        const uploadImage = await cloudinary.uploader.upload(req.file.path)
        const checkIfCompanyExist = await Company.findOne({companyId : companyId})

        if(!checkIfCompanyExist || checkIfCompanyExist === undefined || checkIfCompanyExist === []) {
            throw new Error("Company does not exist");
        }
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
            console.error(error)
            throw new Error("Failed to create engineer account");
        })

        let result = registerUser.map(a => a.userId)

        await Engineer.create([{
            ...engineerAccountInput,
            imageUrl: uploadImage.url, 
            userId: result[0],
            companyId: companyId
        }], { session })
        .catch((error) =>{
            console.error(error)
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
        const {companyId} = req.params
        const fetchAllEngineerData = await Engineer.find({companyId:companyId})
        .catch((error) =>{
            throw new Error("Failed to find engineer account");
        })

        if (!fetchAllEngineerData || fetchAllEngineerData.length === 0 || fetchAllEngineerData === {} ) {
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
        const {engineerId} = req.params
        const findEngineerAccount = await Engineer.findOne({engineerId:engineerId})
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to find engineer account");
        })

        console.log(findEngineerAccount)

        if(!findEngineerAccount) {
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Account does not exist"
                }
            })
        }

        const findEngineerUserAccount = await Engineer.findOne({userId:findEngineerAccount.userId})
        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Fetch Successfully",
                data:{
                    imageUrl:findEngineerAccount.imageUrl,
                    firstName:findEngineerAccount.firstName,
                    lastName:findEngineerAccount.lastName,
                    address:findEngineerAccount.address,
                    licenseNumber:findEngineerAccount.licenseNumber,
                    email:findEngineerUserAccount.email,
                    password:findEngineerUserAccount.password
                }
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
        const {engineerId} = req.params
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

        
        const findEngineerAccount = await Engineer.findOne({engineerId: engineerId})
        
        if(!findEngineerAccount || findEngineerAccount  === undefined || findEngineerAccount === null){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Engineer account not found"
                }
            })
        }

        if(!req.file){
            const updateEngineerAccount = await Engineer.findOneAndUpdate({engineerId:engineerId}, [{$set:{
                firstName: engineerAccountInput.firstName,
                lastName: engineerAccountInput.lastName,
                licenseNumber: engineerAccountInput.licenseNumber,
                address: engineerAccountInput.address
            }}], {session})
    
            const updateEngineerUserAccount = await User.findOneAndUpdate({userId:findEngineerAccount.userId}, {password:hashPassword}, {session})
            
            await session.commitTransaction();
            return res.send({
                status:"SUCCESS",
                statusCode:200,
                response:{
                    message:"Account Updated Successfully"
                }
            })
        }
        const uploadImage = await cloudinary.uploader.upload(req.file.path)
        const updateEngineerAccount = await Engineer.findOneAndUpdate({engineerId:engineerId}, [{$set:{
            firstName: engineerAccountInput.firstName,
            lastName: engineerAccountInput.lastName,
            licenseNumber: engineerAccountInput.licenseNumber,
            address: engineerAccountInput.address
        }}], {session})

        const updateEngineerUserAccount = await User.findOneAndUpdate({userId:findEngineerAccount.userId}, {password:hashPassword}, {session})
        
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

const DELETE_ENGINEER = async (req,res ) =>{
    try {
        const {engineerId} = req.params

        const findEngineer = await Engineer.findOne({engineerId: engineerId})

        if(!findEngineer || findEngineer === null || findEngineer === undefined){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Engineer does not exist"
                }
            })
        }
        
        //find and map crew id to delete all the user account associated with crew schema

        const findProject = await Project.find({engineerId: engineerId})
        const projectIds = findProject.map(projectId => projectId.projectId)

        const findCrew = await Crew.find({companyId: findEngineer.companyId})
        const crewUserId = findCrew.map(userId => userId.userId)
        const crewIds = findCrew.map(crewId => crewId.crewId)
        
        //delete everything account associated with company
        await Promise.all([
            Crew.deleteMany({projectId:{$in : projectIds}}),
            User.deleteMany({$or: [{ userId: { $in: crewUserId } }, { userId: { $in: findEngineer.userId } }]}),
            Project.deleteMany({engineerId:engineerId}),
            Image.deleteMany({projectId: {$in : projectIds }}),,
            Task.deleteMany({projectId: {$in : projectIds }}),,
            dailyReport.deleteMany({projectId: {$in : projectIds }}),,
            Dtr.deleteMany({projectId: {$in : projectIds }}),
            Engineer.deleteOne({engineerId:engineerId})
        ])

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message: "Deleted Successfully"
            }
        })
    } catch (error) {
        console.error(error);
        res.send({
            status:"INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                message:"Failed to find engineer account"
            }
        })
    }
}

module.exports = {
    ADD_ENGINEER_ACCOUNT,
    EDIT_ENGINEER_ACCOUNT,
    GET_ALL_ENGINEER_ACCOUNT_BY_COMPANY,
    GET_ENGINEER_ACCOUNT_BY_ID,
    DELETE_ENGINEER
}