//utils
const mongoose = require('mongoose');
const conn = mongoose.connection;
const cloudinary = require('../../utils/cloudinary')

//models 
const User = require('../../models/user')
const Company = require('../../models/company')

//library
const bcrypt = require('bcrypt');
const saltRounds = 10

const ADD_ADMIN_ACCOUNT = async (req, res) => {
    try {
        const {email, password} = req.body;
        const checkAdminIfExist = await User.findOne({email: email})
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to create Crew account");
        })

        if (checkAdminIfExist){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Admin already exists"
                }
            })
        }
        const hashPassword = bcrypt.hashSync(password, saltRounds)

        const createAdmin = await User.create({email:email, password:hashPassword, roleId:"1"})
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to create Crew account");
        })

        if(!createAdmin){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Failed to create admin"
                }
            })
        }

        res.send({
            status:"OK",
            statusCode:200,
            response:{
                message:"Admin successfully created"
            }
        })

    } catch (err) {
        return res.send({
            status:"INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                message: err.message
            }
        })
    }
}

const ADD_COMPANY_ACCOUNT = async (req, res) => {

    const session = await conn.startSession()
    try {
        session.startTransaction()

        const uploadImage = await cloudinary.uploader.upload(req.file.path)

        const registerUser = {
            email: req.body.email,
            password: req.body.password,
        }

        const registerCompany = {
            companyName: req.body.companyName,
            address: req.body.address,
            contactNumber: req.body.contactNumber
        }
        
        const checkEmailIfExist = await User.findOne({email:registerUser.email})
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to create Crew account");
        })
        if(checkEmailIfExist) {
            return res.send({
                status:"SUCCESS",
                statusCode:200,
                response:{
                    message:"Email Already Exists"
                }
            })
        }

        const hashPassword = bcrypt.hashSync(registerUser.password, saltRounds)

        const createUser = await (await User.create([{email:registerUser.email, password:hashPassword, roleId: "2"}], {session}))
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to create Crew account");
        })

        if(!createUser){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Failed to add user"
                }
            })
        }

        let id = createUser.map(a => a._id)

        const createCompany = await Company.create([{
           ...registerCompany,
           userId: id[0],
           imageUrl: uploadImage.url
        }], {session})
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to create Crew account");
        })
        
        if(!createCompany){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Failed to add company"
                }
            })
        }

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Successfully Added Company"
            }
        })

        await session.commitTransaction();

    } catch (err) {
        res.send({
            status:"INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                message:err.message
            }
            
        })
        await session.abortTransaction();
    }
    session.endSession();
}

const GET_ALL_ADMIN_ACCOUNT = async (req,res) => {
    try {
        const getAllAdmin = await User.find({roleId: "1"})
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to create Crew account");
        })

        if (!getAllAdmin) {
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Failed to get all accounts"
                }
            })
        }

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Fetch all admin successfully",
                data:getAllAdmin
            }
        })
    } catch (err) {
        return res.send({
            status:"INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                message: err.message
            }
        })
    }
}

const GET_ADMIN_ACCOUNT_BY_ID = async (req, res) => {
    try {
        const {_id} = req.params
        const findAdminAccount = await User.find({_id:_id})
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to create Crew account");
        })

        if(!findAdminAccount) {
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Failed to find admin account"
                }
            })
        }

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Fetch Successfully",
                data:findAdminAccount
            }
        })
    } catch (err) {
        return res.send({
            status:"INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                message:err.message,
            }
        })
    }
}

const GET_COMPANY_ACCOUNT_BY_ID = async (req, res) => {
    try {
        const {comapanyUserId} = req.params
        const findCompanyAccount = await Company.find({userId:comapanyUserId})
        .populate('userId')
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to create Crew account");
        })

        if(!findCompanyAccount) {
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Failed to find admin account"
                }
            })
        }

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Fetch Successfully",
                data:findCompanyAccount
            }
        })
    } catch (err) {
        return res.send({
            status:"INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                message:err.message,
            }
        })
    }
}

const GET_ALL_COMPANY_ACCOUNT = async (req,res) => {
    try {
        const fetchAllCompanyData = await Company.find({roleId:"2"}).populate('userId')
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to create Crew account");
        })

        if (!fetchAllCompanyData) {
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Failed to get all accounts"
                }
            })
        }

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Fetch all companies account successfully",
                data:fetchAllCompanyData
            }
        })
    } catch (err) {
        return res.send({
            status:"INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                message: err.message
            }
        })
    }
}

const EDIT_ADMIN_ACCOUNT = async (req, res) =>{
    try {
        const {adminUserId} = req.params
        const {email, password} = req.body;
        const updateAdminAccount = await User.findByIdAndUpdate(adminUserId, {email: email, password: password})
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to create Crew account");
        })

        if(!updateAdminAccount){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Failed to Update account"
                }
            })
        }

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Account Updated Successfully"
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

const EDIT_COMPANY_ACCOUNT = async (req, res) =>{
    const session = await conn.startSession()
    try {
        session.startTransaction()
        const {companyAdminId} = req.params
        const updateUser = {
            email: req.body.email,
            password: req.body.password,
            roleId: req.body.roleId
        }

        const registerCompany = {
            companyName: req.body.companyName,
            address: req.body.address,
            contactNumber: req.body.contactNumber
        }
        
        const uploadImage = await cloudinary.uploader.upload(req.file.path)
        const hashPassword = bcrypt.hashSync(updateUser.password, saltRounds)

        const updateCompanyUserAccount = await User.findByIdAndUpdate(companyAdminId, [{$set: {
            email:updateUser.email, 
            password:hashPassword, 
            roleId: updateUser.roleId, 

        }}], {session})
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to create Crew account");
        })
        
        if(!updateCompanyUserAccount){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Failed to Update Account"
                }
            })
        }

        const updateCompanyAccount = await Company.findOneAndUpdate({
            userId: updateCompanyUserAccount._id
            },[{$set: {
                ...registerCompany,
                imageUrl: uploadImage.url,
            }}], {session})
            .catch((error) =>{
                console.error(error);
                return res.send({
                    status: "FAILED",
                    statusCode: 500,
                    response: {
                        message: error.message
                    }
                });
            })

        if(!updateCompanyAccount){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Failed to Update Account"
                }
            })
        }

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Account Updated Successfully"
            }
        })
        await session.commitTransaction();

    } catch (err) {
        res.send({
            status:"INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                message:err.message
            }
        })
        await session.abortTransaction();
    }
    session.endSession();
}

module.exports= {
    ADD_ADMIN_ACCOUNT,
    GET_ALL_ADMIN_ACCOUNT,
    ADD_COMPANY_ACCOUNT,
    GET_ALL_COMPANY_ACCOUNT,
    EDIT_COMPANY_ACCOUNT,
    EDIT_ADMIN_ACCOUNT,
    GET_ADMIN_ACCOUNT_BY_ID,
    GET_COMPANY_ACCOUNT_BY_ID
}