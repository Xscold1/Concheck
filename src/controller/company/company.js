//models
const Engineer = require('../../models/engineer');
const Company = require('../../models/company');
const User = require('../../models/user');
//utils
const conn = mongoose.connection;

const ADD_ENGINEER_ACCOUNT = async (req, res) => {

    const session = await conn.startSession();

    try {

        session.startTransaction();

        const {firstName, lastName, email, password, roleId, licenseNumber, address} = req.body;

        const checkEmailIfExists = await User.findOne({email: email}).exec();
        
        if(checkEmailIfExists) {
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Email already exists"
                }
            })
        }


        const registerUser = await User.create([{email: email, password: password, roleId: roleId, }], { session }).exec()

        if(!registerUser){
            return res.send({
                status: "Failed",
                statusCode: 400,
                response:{
                    message: "Something went wrong"
                }
            })
        };

        let result = registerUser.map(a => a._id)

        const registerEngineer = await Engineer.create([{firstName: firstName, lastName: lastName, age: age, address: address, licenseNumber: licenseNumber, userId: result[0]}], { session })

        if(!registerEngineer){
            return res.send({
                status: "Failed",
                statusCode: 400,
                response:{
                    message: "Something went wrong"
                }
            })
        };

        res.send({
            status: "success",
            statusCode: 200,
            message: "Successfully registered",
        })

        await session.commitTransaction();

    } catch (err) {

        res.send({
                status:"INTERNAL SERVER ERROR",
                statusCode:500,
                response:{
                    message: err.message
                }
            })
            
        await session.abortTransaction();
    }

    session.endSession();
}

const GET_ALL_ENGINEER_ACCOUNT = async (req, res)=>{
    try {
        const fetchAllEngineerData = await Engineer.find({roleId:"2"}).populate('userId').exec()

        if (!fetchAllEngineerData) {
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
                data:fetchAllEngineerData
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

const EDIT_ENGINEER_ACCOUNT = async (req, res)=>{
    const session = await conn.startSession()
    try {
        session.startTransaction()
        const{firstName, email, password, lastName, address, _id, licenseNumber, } = req.body
        
        if(!_id){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Id cannot be undefined"
                }
            })
        }

        const updateEngineerUserAccount = await User.findByIdAndUpdate(_id, {email: email, password: password}, {session}).exec()
        
        if(!updateEngineerUserAccount){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Failed to Update Account"
                }
            })
        }

        const updateEngineerAccount = await Engineer.findOneAndUpdate({userId: updateEngineerUserAccount._id},[{$set: {firstName:firstName, lastName: lastName, address:address, licenseNumber:licenseNumber}}], {session}).exec()


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


module.exports = {
    ADD_ENGINEER_ACCOUNT,
    EDIT_ENGINEER_ACCOUNT,
    GET_ALL_ENGINEER_ACCOUNT
}