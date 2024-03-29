
//import
const mongoose = require('mongoose');
const conn = mongoose.connection;
const path = require('path');
const {google} = require('googleapis');
//const status = require('../constant/statusCode');

//models
const User = require('../../models/user');
const Engineer = require('../../models/engineer');
const Project = require('../../models/project');


//utils
const cloudinary = require('../../utils/cloudinary');
const googleAuth = require('../../utils/googleAuth');
const { projectDetailsSchema } = require('../../validations/userSchema');


const CREATE_PROJECT = async (req, res) => {
    try {
        const {engineerId} = req.params
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
        }

        const {error} = projectDetailsSchema.validate(createProjectInfo)
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
        const checkProjecifExist = await Project.findOne({projectName: createProjectInfo.projectName})

        if(checkProjecifExist){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message: "Project already exists"
                }
            })
        }
        
        const findEngineerIfExist = await Engineer.findOne({engineerId: engineerId})
        const findEngineerUser = await User.findOne({userId:findEngineerIfExist.userId})

        if(!findEngineerIfExist || findEngineerIfExist === undefined || findEngineerIfExist === []){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message: "Engineer does not exist"
                }
            })
        }
        const spreadsheetName = 'spreadsheet1';
        const request = {
            resource: {
                properties: {
                    title: spreadsheetName,
                },
            },
            auth:googleAuth,
        };
        const sheets = google.sheets({version: 'v4', auth: googleAuth});
        
        const response = await sheets.spreadsheets.create(request);
        const spreadsheetId = response.data.spreadsheetId;
        console.log(spreadsheetId);
        
        await Project.create({
            ...createProjectInfo,
            companyId: findEngineerIfExist.companyId,
            engineerId: findEngineerIfExist.engineerId,
            imageUrl: uploadImage.url,
            spreadsheetId: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=166398060`
        })

        const drive = google.drive({ version: "v3", auth: googleAuth });
        await drive.permissions.create({
        resource: {
            type: "user",
            role: "writer",
            emailAddress: findEngineerUser.email,  // Please set the email address you want to give the permission.
        },
            fileId: spreadsheetId,
            fields: "id",
        });

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message: "Project created successfully",
            }
        })

    } catch (error) {
        console.error(error);
        return res.send({
            status: "INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                messsage: "Failed to create project"
            }
        })
    }
}

const GET_ALL_PROJECT = async (req, res) => {
    try {
        const {engineerId} = req.params
        const fetchAllProject = await Project.find({engineerId: engineerId})
        
        if(fetchAllProject.length === 0 || fetchAllProject === undefined || fetchAllProject === null){
            return res.send({
                status:"SUCCESS",
                statusCode:200,
                response:{
                    message:"There is no available project. Click start new project to create Project"
                }
            })
        }
    
        // Check if target date is equal to today's date
        const today = new Date()
        const projectsToUpdate = fetchAllProject.filter(project => {
            return project.endDate.getDate() === today.getDate() &&
                   project.endDate.getMonth() === today.getMonth() &&
                   project.endDate.getFullYear() === today.getFullYear()
        })
    
        // Update the status of projects that meet the criteria
        projectsToUpdate.forEach(async (project) => {
                project.status = "completed"
                await project.save()
        })
    
        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"SUCCESS",
                data:fetchAllProject
            }
        })

    } catch (error) {
        console.error(error)
        return res.send({
            status: "INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                messsage: "Failed to create project"
            }
        })
    }
}

const EDIT_PROJECT = async (req, res) => {
    try {
        const {projectId} = req.params
        const createProjectInfo = {
            siteEngineer:req.body.siteEngineer,
            safetyOfficer:req.body.safetyOfficer,
            projectCode:req.body.projectCode,
            status:req.body.status, 
            budget:req.body.budget,
        }

        if(!req.file){
            const findAndUpdateProject = await Project.findOneAndUpdate({projectId:projectId}, {
                $set:{
                    ...createProjectInfo,
                }})
            .catch((error) =>{
                    console.error(error);
                    throw new Error("Failed to Update Project");
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
        const findAndUpdateProject = await Project.findByIdAndUpdate(projectId, {
            $set:{
                ...uploadImage,
                imageUrl:uploadImage.url
            }})
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to Update Project");
        })
        if(!findAndUpdateProject){
            throw new Error("Failed to Update Project")
        } 

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Update Successfully"
            }
        })

    } catch (error) {
        console.error(error);
        return res.send({
            status: "INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                messsage: "Failed to Update Project"
            }
        })
    }
}

const DELETE_PROJECT = async (req, res) => {
    try {
        const {projectId} = req.params
        const findByIdAndDelete = await Project.findOneAndDelete({projectId: projectId})

        if(!findByIdAndDelete || findByIdAndDelete === undefined || findByIdAndDelete === null){
            return res.send({
                status: "FAILED",
                statusCode:400,
                response:{
                    messsage: "Project do not exist"
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
        console.error(error);
        return res.send({
            status: "INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                messsage: "Failed to delete project"
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