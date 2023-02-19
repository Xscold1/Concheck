//utils
const mongoose = require('mongoose');
const conn = mongoose.connection;

//models user
const User = require('../../models/user')

const CREATE_ADMIN = async (req, res) => {
    try {
        const {email, password, roleId} = req.body;
        const checkAdminIfExist = await User.findOne({email: email})

        if (!checkAdminIfExist){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Admin already exists"
                }
            })
        }

        const createAdmin = await User.create({emal:email, password:password, roleId:roleId})
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
                message: err
            }
        })
    }
}

const VIEW_ALL_ACCOUNT = async (req,res) => {
    try {
        const getAllComapany = await User.find({roleId: "2"})

        if (!getAllComapany) {
            return res.send({
                status:"FAILED",
                statusCode:400,
                resposne:{
                    message:"Failed to get all accounts"
                }
            })
        }

    
        res.send({

        })
    } catch (err) {
        return res.send({
            status:"INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                message: err
            }
        })
    }
}



module.exports= {
    CREATE_ADMIN,
    VIEW_ALL_ACCOUNT,

}