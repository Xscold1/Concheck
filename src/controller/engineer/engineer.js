
//utils
const mongoose = require('mongoose');
const conn = mongoose.connection;
//const status = require('../constant/statusCode');

//models
const User = require('../../models/user');
const Engineer = require('../../models/engineer');
const Project = require('../../models/project');


const CREATE_PROJECT = async (req, res) => {
    try {
        const {image , projectName, startDate, endDate, projectEngineer, siteEngineer, safetyOfficer, projectCode, status, budget} = req.body;

        const checkProjecifExist = await Project.findOne({projectNaem: projectName});

        if(checkProjecifExist){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message: "Project already exists"
                }
            })
        }

        const createProject = await Project.create({image: image, projectName: projectName, startDate: startDate, endDate: endDate, projectEngineer: projectEngineer, siteEngineer: siteEngineer, safetyOfficer: safetyOfficer, projectCode: projectCode, status:status, budget:budget})

        if(!createProject){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message: "Failed to create project"
                }
            })
        }

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message: "Project created successfully",
            }
        })

    } catch (err) {
        return res.send({
            status: "INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                messsage: err.message
            }
        })
    }
}

const GET_ALL_PROJECT = async (req, res) => {
    try {
        const {projectEngineer} = req.body
        const fetchAllProject = await Project.find({projectEngineer: projectEngineer})

        if(!fetchAllProject){
            return res.send({
                status:"SUCCESS",
                statusCode:200,
                response:{
                    message:"There is no available project Click start new project to create Project"
                }
            })
        }

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"SUCCESS",
                data:{
                    fetchAllProject
                }
            }
        })
    } catch (err) {
        return res.send({
            status: "INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                messsage: err.message
            }
        })
    }
}

const EDIT_PROJECT = async (req, res) => {
    try {
        const {image , projectName, startDate, endDate, projectEngineer, siteEngineer, safetyOfficer, projectCode, status, budget, _id} = req.body;

        const findAndUpdateProject = await Project.findByIdAndUpdate(_id, {$set:{image:image,projectName:projectName, startDate:startDate, endDate:endDate,budget:budget, status:status, projectEngineer:projectEngineer, siteEngineer:siteEngineer, siteEngineer:siteEngineer, safetyOfficer:safetyOfficer, projectCode:projectCode}})

        if(!findAndUpdateProject){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Failed to update Project"
                }
            })
        }
        
        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Update Successfully"
            }
        })
    } catch (err) {
        return res.send({
            status: "INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                messsage: err.message
            }
        })
    }
}

const DELETE_PROJECT = async (req, res) => {
    try {
        const {_id} = req.body
        const findByIdAndDelete = await Project.findByIdAndDelete(_id)

        if(!findByIdAndDelete){
            return res.send({
                status: "FAILED",
                statusCode:400,
                response:{
                    messsage: "Failed to delete Project"
                }
            })
        }

        res.send({
            status: "SUCCESS",
            statusCode:200,
            response:{
                message:"Project successfully Deleted",
            }
        })
    } catch (error) {
        return res.send({
            status: "INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                messsage: err.message
            }
        })
    }
}

module.exports = {
    CREATE_PROJECT,
    GET_ALL_PROJECT,
    EDIT_PROJECT,
    DELETE_PROJECT
}