//utils
const mongoose = require('mongoose');
const conn = mongoose.connection;
const cloudinary = require('../../utils/cloudinary')
const Validation = require('../../utils/validation');
//models 
const User = require('../../models/user')
const Company = require('../../models/company')

//library
const bcrypt = require('bcrypt');
const saltRounds = 10

const ADD_ADMIN_ACCOUNT = async (req, res) => {
    try {

        const input = req.body;
        const checkValidity = Validation(input, User)
        const {email, password} = req.body;
        const checkAdminIfExist = await User.findOne({email: email})
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to find user");
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

        await User.create({email:email, password:hashPassword, roleId:"1"})
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to create admin account");
        })

        res.send({
            status:"OK",
            statusCode:200,
            response:{
                message:"Admin successfully created"
            }
        })

    } catch (error) {
        console.error(error)
        return res.send({
            status:"INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                message: "Failed to create admin account"
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
            throw new Error("Failed to find user");
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

        const createCompanyUserAccount =  await User.create([{email:registerUser.email, password:hashPassword, roleId: "2"}],{session})
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to Create Company User Account");
        })

        if(!createCompanyUserAccount){
            throw new Error("Failed to Create Company User Account");
        }

        let id = createCompanyUserAccount.map(a => a._id)

        const createCompany = await Company.create([{
           ...registerCompany,
           userId: id[0],
           imageUrl: uploadImage.url
        }], {session})
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to Insert Comapny Detailes");
        })
        
        if(!createCompany){
            throw new Error("Failed to Insert Comapny Detailes");
        }

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Successfully Added Company Account"
            }
        })

        await session.commitTransaction();

    } catch (error) {
        console.error(error)
        res.send({
            status:"INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                message: "Failed to Create Company Account"
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
            throw new Error("Failed to find admin accounts");
        })

        if (!getAllAdmin || getAllAdmin.length === 0){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"No Admin Account found"
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
    } catch (error) {
        console.error(error)
        return res.send({
            status:"INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                message: "Failed to find admin accounts"
            }
        })
    }
}

const GET_ADMIN_ACCOUNT_BY_ID = async (req, res) => {
    try {
        const {_id} = req.params
        const findAdminAccount = await User.findOne({_id:_id})
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to find admin account");
        })

        if(!findAdminAccount) {
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Admin account not found"
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
    } catch (error) {
        console.error(error)
        return res.send({
            status:"INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                message:"Failed to find admin account",
            }
        })
    }
}

const GET_COMPANY_ACCOUNT_BY_ID = async (req, res) => {
    try {
        const {comapanyUserId} = req.params
        const findCompanyAccount = await Company.findOne({userId:comapanyUserId})
        .populate('userId')
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to find company account");
        })

        if(!findCompanyAccount) {
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Comapany account do not exist"
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
    } catch (error) {
        console.error(error);
        return res.send({
            status:"INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                message:"Failed to find company account"
            }
        })
    }
}

const GET_ALL_COMPANY_ACCOUNT = async (req,res) => {
    try {
        const fetchAllCompanyData = await Company.find({roleId:"2"}).populate('userId')
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to find company account");
        })

        if (!fetchAllCompanyData || fetchAllCompanyData.length === 0) {
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"No company account found"
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
    } catch (error) {
        console.error(error);
        return res.send({
            status:"INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                message: "Failed to find company account"
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
            throw new Error("Failed to find and update admin account");
        })

        if(!updateAdminAccount){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Admin account do not exist"
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

    } catch (error) {
        console.error(error)
        res.send({
            status:"INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                message:"Failed to find and update admin account"
            }
        })
    }
}

const EDIT_COMPANY_ACCOUNT = async (req, res) =>{
    const session = await conn.startSession()
    try {
        session.startTransaction()
        const {companyUserId} = req.params
        const updateUser = {
            password: req.body.password,
        }

        const registerCompany = {
            companyName: req.body.companyName,
            address: req.body.address,
            contactNumber: req.body.contactNumber
        }
        
        const hashPassword = bcrypt.hashSync(updateUser.password, saltRounds)

        const updateCompanyUserAccount = await User.findByIdAndUpdate(companyUserId, [{$set: {
            password:hashPassword, 

        }}], {session})
        .catch((error) =>{
            throw new Error("Failed to update company account");
        })
        
        //run this user if does not upload new picture
        if(!req.file){
            await Company.findOneAndUpdate({
                userId: companyUserId
                },[{$set: {
                    ...registerCompany,
                }}], {session})
            .catch((error) =>{
                throw new Error("Failed to update company account");
            })
            return res.send({
                status:"SUCCESS",
                statusCode:200,
                response:{
                    message:"Account Updated Successfully"
                }
            })
        }
        
        //run this code if user upload new picture
        const uploadImage = await cloudinary.uploader.upload(req.file.path)
        const updateCompanyAccount = await Company.findOneAndUpdate({userId: updateCompanyUserAccount._id},[{
            $set: {
                ...registerCompany,
                imageUrl: uploadImage.url,
            }}], {session})
        .catch((error) =>{
            throw new Error("Failed to update company account");
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
        console.error(error)
        res.send({
            status:"INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                message:"Failed to update company account"
            }
        })
        await session.abortTransaction();
    }
    session.endSession();
}

const DELETE_ADMIN = async (req, res) => {
    try {
        
    } catch (error) {
        
    }
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