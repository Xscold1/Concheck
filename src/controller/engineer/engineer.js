
//import
const mongoose = require('mongoose');
const conn = mongoose.connection;
//const status = require('../constant/statusCode');

//models
const User = require('../../models/user');
const Engineer = require('../../models/engineer');
const Project = require('../../models/project');

//utils
const cloudinary = require('../../utils/cloudinary')


const CREATE_PROJECT = async (req, res) => {
    try {
        const createProjectInfo = {
            projectName:req.body.projectName,
            startDate:req.body.startDate,
            endDate:req.body.endDate,
            projectEngineer:req.body.projectEngineer,
            siteEngineer:req.body.siteEngineer,
            safetyOfficer:req.body.safetyOfficer,
            projectCode:req.body.projectCode,
            status:req.body.status, 
            budget:req.body.budget,
            projectEngineerId: req.body._id
        }

        const uploadImage = await cloudinary.uploader.upload(req.file.path)
        const checkProjecifExist = await Project.findOne({projectName: createProjectInfo.projectName});

        if(checkProjecifExist){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message: "Project already exists"
                }
            })
        }

        const createProject = await Project.create({
            ...createProjectInfo,
            imageUrl: uploadImage.url
            })

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
        const {projectEngineer} = req.params
        console.log(projectEngineer)
        const fetchAllProject = await Project.find({projectEngineer: projectEngineer}).exec()

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
                data:fetchAllProject
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
        const {_id} = req.params
        const createProjectInfo = {
            siteEngineer:req.body.siteEngineer,
            safetyOfficer:req.body.safetyOfficer,
            projectCode:req.body.projectCode,
            status:req.body.status, 
            budget:req.body.budget,
        }

        const uploadImage = await cloudinary.uploader.upload(req.file.path)
        
        const findAndUpdateProject = await Project.findByIdAndUpdate(_id, {
            $set:{
                ...createProjectInfo,
                imageUrl:uploadImage.Url
            }})

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
        const {_id} = req.params
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