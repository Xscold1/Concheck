
//utils
const mongoose = require('mongoose');
const User = require('../models/user');
const Engineer = require('../models/Engineer');


const REGISTER = async (req, res,) => {
    try {
        const {firstName, lastName, email, password, age, roleId} = req.body;
        const checkSameEmail = await User.findOne({email: email});
        if(checkSameEmail){
            return res.send({
                status: "success",
                statusCode: 200,
                message: "Email already exists",
            });
        }
        const registerUser = await User.create({email: email, password: password})
        if(!registerUser){
            return res.send({
                status: "Failed",
                statusCode: 400,
                response:{
                    message: "Something went wrong"
                }
            })
        };
        const registerEngineer = await Engineer.create({firstName: firstName, lastName: lastName, age: age, roleId: roleId})
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
    } catch (err) {
        res.send({
            status: "error",
            statusCode:500,
            message: err.message,
        })
    }    
}
const LOGIN = async (req, res) => {
    try {
        
    } catch (err) {
        res.send({
            status: "error",
            statusCode:500,
            message: err.message,
        })
    }
}

module.exports = {
    REGISTER,
    LOGIN,
}