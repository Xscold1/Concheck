//import
const mongoose = require('mongoose');
const conn = mongoose.connection;
const bcrypt = require('bcrypt');
const csv = require('fast-csv');
const {format, parse, parseISO, isBefore, isAfter, isEqual, startOfWeek, endOfWeek } = require('date-fns');
const path = require('path');
const os = require('os');
const fs = require('fs');

//models
const Project = require('../../models/project');
const Image = require('../../models/image');
const Crew = require('../../models/crew');
const User = require('../../models/user');
const Task = require('../../models/task');
const DailyReport = require('../../models/dailyReport');

//utils
const cloudinary = require('../../utils/cloudinary');
const {userSchema, crewDetailsSchema} = require('../../validations/userSchema');

//global variables
const saltRounds = 10


const ADD_TASK = async (req, res) => {
    try {
        const {projectId} = req.params;
        const {taskName, startDate, endDate, status} = req.body;

        const findProject = await Project.findOne({projectId: projectId});

        if (!findProject) {
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Project not found"
                }
            });
        }

        const projectStartDate = parseISO(findProject.startDate.toISOString().split("T")[0]);
        const projectEndDate = parseISO(findProject.endDate.toISOString().split("T")[0]);
        const taskStartDate = parseISO(startDate);
        const taskEndDate = parseISO(endDate);

        if (isBefore(taskStartDate, projectStartDate)) {
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Cannot add task that starts before the project start date"
                }
            });
        } else if (isAfter(taskEndDate, projectEndDate)) {
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Cannot add task that ends after the project end date"
                }
            });
        } else if (isAfter(taskStartDate, taskEndDate )) {
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Task start date cannot be after task end date"
                }
            });
        }else if (isEqual(taskStartDate, taskEndDate)){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Task Date cannot be equal"
                }
            });
        }

        const addTask = await Task.create({
            taskName: taskName,
            startDate: taskStartDate,
            endDate: taskEndDate,
            status: status,
            projectId: projectId,
        });

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Task added successfully"
            }
        });
    } catch (error) {
        console.error(error);
        res.send({
            status:"INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                message:"Failed to add task"
            }
        });
    }
};

const ADD_DAILY_REPORT = async (req,res)=>{
    try {
        const {projectId} = req.params
        const {remarks, weatherReport, causeOfDelay, hoursDelay} = req.body

        const now = new Date();
        const date = format(now, 'MM-dd-yyyy');

        const isExist = await  DailyReport.findOne({date: date, projectId:projectId})

        if(isExist){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Already added daily report today click edit to edit daily report"
                }
            })
        }

        const insertDailyReport = await DailyReport.create({
            remarks:remarks,
            weatherReport:weatherReport,
            causeOfDelay:causeOfDelay,
            hoursDelay:hoursDelay,
            projectId: projectId,
            date:date
        })

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Inserted daily report successfully"
            }
        })

    } catch (error) {
        console.error(error);
        res.send({
            status:"Internal Server Error",
            statusCode:500,
            response:{
                message:"Failed to insert daily report"
            }
        })
    }
}

const ADD_CREW_ACCOUNT = async (req, res) => {
    const session = await conn.startSession()
    try {
        const {projectId} = req.params
        session.startTransaction()
        const timeFormat = 'HH:mm';
        const dateFormat = 'dd-MM-yyyy'

        try {
            await userSchema.validateAsync({email: req.body.email, password: req.body.password})
        } catch (error) {
            if(error){
                return res.send({
                    status:"FAILED",
                    statusCode:400,
                    response:{
                        message:error.message
                    }
                })
            }
        }

        const {error} = crewDetailsSchema.validate({firstName: req.body.firstName, lastName: req.body.lastName, dailyRate: req.body.dailyRate, startShift: req.body.startShift, endShift: req.body.endShift})
        if(error){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:error.message
                }
            })
        }

        const {email , password , startShift, endShift, dailyRate, firstName, lastName} = req.body

        const endShiftParse = parse(endShift, timeFormat, new Date());
        const startShiftParse = parse(startShift,timeFormat, new Date());
        
        let hourlyRate =  dailyRate /  (((endShiftParse.getTime() - startShiftParse.getTime())/3600000) - 1);

        const checkEmailIfExists = await User.findOne({email:email})
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to create Crew account");
        })

        if(checkEmailIfExists){
            return res.send({
                status: "FAILED",
                statusCode:400,
                response:{
                    messsage: "Email Already Exists"
                }
            })
        }
        
        const checkIfProjectExist = await Project.findOne({projectId:projectId})
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to create Crew account");
        })

        if(!checkIfProjectExist || checkIfProjectExist === undefined || checkIfProjectExist === null){
            return res.send({
                status: "FAILED",
                statusCode:400,
                response:{
                    messsage: "Project Not Found"
                }
            })
        }

        const hashPassword = bcrypt.hashSync(password, saltRounds)

        const createCrewUserAccount = await User.create([{
            email:email, 
            password:hashPassword, 
            roleId:"4"
        }], {session})
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to create crew account");
        })

        let userId = createCrewUserAccount.map(a => a.userId)

        const createCrewAccount = await Crew.create([{
            firstName: firstName,
            lastName: lastName,
            dailyRate:dailyRate,
            startShift:startShift,
            endShift:endShift,
            userId:userId[0],
            companyId:checkIfProjectExist.companyId,
            projectId:projectId,
            hourlyRate: hourlyRate.toFixed(2),
        }], {session})
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to create crew account");
        })

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Account created Successfully"
            }
        })
        session.commitTransaction()
    } catch (error) {
        console.error(error);
        res.send({
            status: "INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                messsage: "An error occurred while creating account"
            }
        })
        await session.abortTransaction()
    }
    session.endSession
}

const UPLOAD_IMAGE = async (req,res)=>{
    try {
        const {projectId} = req.params
        const images = req.files;
        const captions = req.body.caption;

        const now = new Date();
        const date = format(now, 'yyyy-MM-dd');

        const checkIfProjectExist = await Project.findOne({projectId:projectId})
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to save images")
        })

        if(!checkIfProjectExist || checkIfProjectExist === undefined || checkIfProjectExist === null){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Project do not exist "
                }
            })
        }

        // Iterate over the uploaded images and captions
        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            const caption = captions[i];
            // Upload the image to Cloudinary

            const result = await cloudinary.uploader.upload(image.path)
        
            // Create a new image document and save it to the database

            const newImage = new Image({
                imageUrl: result.url,
                caption: caption,
                projectId: projectId,
                date: date
            });

            newImage.save()
            .catch((error) =>{
                console.error(error);
                throw new Error("Failed to save images")
            })
    }
      
        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Uploaded image successfully"
            }
        })

    } catch (error) {
        console.error(error);
        res.send({
            status:"Internal Server Error",
            statusCode:500,
            response:{
                message:"Failed to save images"
            }
        })
    }
}

const GET_ALL_TASK = async (req, res)=>{
    try {
        const {projectId} = req.params

        const fetchAlltask = await Task.find({projectId: projectId})
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to find Task");
        })
        
        
        if(fetchAlltask.length === 0){
            return res.send({
                status:"SUCCESS",
                statusCode:200,
                response:{
                    message:"No task Found"
                }
            })
        }

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Successfully fetched all tasks",
                data: fetchAlltask
            }
        })
    } catch (error) {
        console.error(error)
        res.send({
            status:"Internal Server Error",
            statusCode:500,
            response:{
                message:"Failed to find tasks"
            }
        })
    }
}

const GET_PROJECT_BY_ID = async (req, res) => {
    try {
        const {projectId} = req.params

        const fetchProjectDetails = await Project.findOne({projectId: projectId})
        .catch((error) =>{
            console.error(error);
            throw new Error("An error occurred while fetching project");
        })

        if(!fetchProjectDetails) {
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Project not found"
                }
            })
        }

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Fetch Successfully",
                data:fetchProjectDetails
            }
        })
    } catch (error) {
        console.error(error)
        res.send({
            status:"Internal Server Error",
            statusCode:500,
            response:{
                message:"An error occurred while fetching project"
            }
        })
    }
}

const GET_ALL_CREW_BY_PROJECT = async (req, res) => {
    try {
        const {projectId} = req.params
        const fetchAllCrew = await Crew.find({projectId:projectId})
        .catch((error) =>{
            console.error(error);
            throw new Error("An error occurred while fetching crew accounts");
        })

        if(fetchAllCrew.length === 0 ){
            return res.send({
                status:"SUCCESS",
                statusCode:200,
                response:{
                    message:"No Crew Found"
                }
            })
        }

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Successfully fetched all tasks",
                data: fetchAllCrew
            }
        })
    } catch (error) {
        console.error(error)
        res.send({
            status:"Internal Server Error",
            statusCode:500,
            response:{
                message:"An error occurred while fetching crew accounts"
            }
        })
    }
}

const GET_DAILY_REPORT_BY_ID = async (req, res) => {
    try {
        const {dailyReportId} = req.params
        const fetchDailyReport = await DailyReport.findOne({dailyReportId})
        .catch((error) =>{
            console.error(error);
            throw new Error("An error occurred while fetching daily report");
        })

        if(!fetchDailyReport){
            return res.send({
                status:"Failed",
                statusCode:400,
                response:{
                    message:"No daily report found"
                }
            })
        }

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Successfully fetched all tasks",
                data: fetchDailyReport
            }
        })
    } catch (error) {
        console.error(error);
        res.send({
            status:"Internal Server Error",
            statusCode:500,
            response:{
                message:"An error occurred while fetching daily report",
            }
        })
    }
}

const GET_TASK_BY_ID = async (req, res) => {
    try {
        const {taskId} = req.params
        const findTask = await Task.findOne({taskId:taskId})
        .catch((error) =>{
            console.error(error);
            throw new Error("An error occurred while fetching task");
        })

        if(!findTask){
            return res.send({
                status:"SUCCESS",
                statusCode:200,
                response:{
                    message:"Task not found",
                }
            })
        }
        
        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Task Fetch successfully",
                data:findTask
            }
        })
    } catch (error) {
        console.error(error)
        res.send({
            status:"INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                message:"An error occurred while fetching tasks",
            }
        })
    }
}

const GET_DAILY_REPORT_BY_DATE = async (req, res) => {
    try {
        const {date, projectId} = req.params

        const findDailyReport = await DailyReport.findOne({projectId: projectId, date: date})
        .catch((error) => {
            console.error(error)
            throw new Error ("An error occurred while fetching daily reports")
        })

        
        
        if(!findDailyReport || findDailyReport === undefined || findDailyReport === null) {
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"daily report does not exist",
                }
            })
        }
        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Fetching daily reports successfully",
                data:findDailyReport,
            }
        })
        
    } catch (error) {
        console.error(error)
        res.send({
            status:"INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                message:"An error occurred while fetching tasks",
            }
        })
    }
}

const GET_IMAGE_BY_PROJECT_ID = async (req, res)=>{
    try {
        const {projectId} = req.params

        const findImageByProjectId = await Image.find({projectId:projectId})
        .catch((error) => {
            throw new Error("An error occurred while fetching image ")
        })

        if(!findImageByProjectId || findImageByProjectId === null || findImageByProjectId.length ===0 || findImageByProjectId === undefined){
            return res.send({
                status:"FAILED",
                statusCode: 400,
                response:{
                    message: "There are no image"
                }
            })
        }

        res.send({
            status:"SUCCESS",
            statusCode: 200,
            response:{
                message:"Successfully retrieved image",
                data:findImageByProjectId,
            }
        })
    } catch (error) {
        console.error(error)
        res.send({
            status:"INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                message:"An error occurred while fetching tasks",
            }
        })
    }
}

const GET_IMAGE_BY_ID = async (req, res) => {
    try {
        const {imageId} = req.params

        const findImage = await Image.findOne({imageId: imageId})
        .catch((error)=>{
            throw new Error("An error occurred while fetching Image infomation")
        })
        if(!findImage || findImage === undefined || findImage === null) {
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Image not found"
                }
            })
        }

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Image fetch successfully",
                data:findImage
            }
        })
    } catch (error) {
        console.error(error)
        res.send({
            status:"INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                message:"An error occurred while fetching tasks",
            }
        })
    }
}

const GET_ALL_DAILY_REPORT_BY_PROJECT = async (req, res) => {
    try {
        const {projectId} = req.params

        const findAllDailyReport = await DailyReport.find({projectId:projectId})
        .catch((error) =>{
            console.error(error);
            throw new Error("An Error occurred while fetching daily reports");
        })

        if(!findAllDailyReport.length === 0){
            return res.send({
                status:"FAILED",
                status:400,
                response:{
                    message:"No Daily Report found",
                }
            })
        }
        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:findAllDailyReport
            }
        })

    } catch (error) {
        console.error(error)
        return res.send({
            status:"INTERNAL SERVER ERROR",
            status:500,
            response:{
                message:"An error occurred while fetching daily report"
            }
        })
    }
}

const EDIT_TASK = async (req, res) => {
    try {
        const {taskId} = req.params
        const {taskName, startDate, endDate} = req.body

        const findTask = await Task.findOneAndUpdate({taskId: taskId},{$set:{taskName:taskName, startDate:startDate, endDate:endDate}})
        .catch((error) =>{
            console.error(error);
            throw new Error("An error occurred while updating task");
        })

        if(!findTask){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Task does not exist"
                }
            })
        }

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Task Update Succesfully"
            }
        })

    } catch (error) {
        console.error(error)
        res.send({
            status:"INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                message:"An error occurred while updating task"
            }
        })
    }
}

const EDIT_DAILY_REPORT = async (req, res) => {
    try {
        const {dailyReportId} = req.params
        const {remarks, weatherReport, causeOfDelay, hoursDelay} = req.body
        const updateDailyReport = await DailyReport.findOneAndUpdate({dailyReportId: dailyReportId},
            {$set:{
                remarks:remarks,
                weatherReport:weatherReport, 
                causeOfDelay:causeOfDelay, 
                hoursDelay:hoursDelay}
        })
        .catch((error) =>{
            console.error(error);
            throw new Error("An error occurred while updating daily report");
        })

        if(!updateDailyReport){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Daily report does not exist"
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
    } catch (error) {
        console.error(error)
        res.send({
            status:"INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                message:"An error occurred while updating daily report"
            }
        })
    }
}

const EDIT_IMAGE = async(req,res) => {
    try {
        const {imageId} = req.params
        const {caption} = req.body
        const findImageAndUpdate = await Image.findOneAndUpdate({imageId: imageId} ,{$set:{caption:caption}})
        .catch((error)=>{
            throw new Error("An error occurred while updating image")
        })

        if(!findImageAndUpdate || findImageAndUpdate === undefined || findImageAndUpdate === null) {
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"An error occurred while updating image"
                }
            })
        }

        
        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Image updated successfully",
            }
        })
    } catch (error) {
        console.error(error)
        res.send({
            status:"INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                message:"An error occurred while fetching tasks",
            }
        })
    }
}

const DELETE_TASK = async (req,res) => {
    try {
        const {taskId} = req.params

        const findTaskAndDelete = await Task.findOneAndDelete({taskId: taskId})
        .catch((error) => {
            throw new Error("An error occurred while deleting task");
        })

        if (!findTaskAndDelete || findTaskAndDelete === undefined || findTaskAndDelete === null) {
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message: "An error occurred while deleting task",
                }
            })
        }

        res.send({
            statusbar: "SUCCESS",
            statusCode:200,
            response:{
                message: "Task deleted successfully"
            }
        })
    } catch (error) {
        console.error(error)
        res.send({
            status:"INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                message:"An error occurred while deleting tasks",
            }
        })
    }
}

const DELETE_DAILY_REPORT = async (req,res) => {
    try {
        const {dailyReportId} = req.params

        const findDailyReportAndDelete = await DailyReport.findOneAndDelete({dailyReportId: dailyReportId})
        .catch((error) => {
            throw new Error("An error occurred while deleting daily report");
        })

        if (!findDailyReportAndDelete || findDailyReportAndDelete === undefined || findDailyReportAndDelete === null) {
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message: "An error occurred while deleting daily report",
                }
            })
        }

        res.send({
            statusbar: "SUCCESS",
            statusCode:200,
            response:{
                message: "daily report deleted successfully"
            }
        })

    } catch (error) {
        console.error(error)
        res.send({
            status:"INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                message:"An error occurred while deleting daily report",
            }
        })
    }
}

const DELETE_IMAGE_BY_ID = async (req,res) => {
    try {
        const {imageId} = req.params

        const findImageAndDelete = await Image.findOneAndDelete({imageId: imageId})
        .catch((error) => {
            throw new Error("An error occurred while deleting image");
        })

        if (!findImageAndDelete || findImageAndDelete === undefined || findImageAndDelete === null) {
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message: "An error occurred while deleting image",
                }
            })
        }

        res.send({
            statusbar: "SUCCESS",
            statusCode:200,
            response:{
                message: "image deleted successfully"
            }
        })

    } catch (error) {
        console.error(error)
        res.send({
            status:"INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                message:"An error occurred while deleting image",
            }
        })
    }
}

const DELETE_CREW = async (req,res) =>{
    try {
        const {crewId} = req.params

        const findCrew = await Crew.findOne({crewId: crewId})
        .catch((error)=>{
            throw new Error("An error occurred while fetching crew information")
        })

        if(!findCrew || findCrew === undefined || findCrew === null){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message: "crew does not exist",
                }
            })
        }

        await Promise.all([
            Crew.deleteOne({crewId: crewId}),
            Dtr.deleteMany({crewId:crewId}),
            User.deleteOne({userId: findCrew.userId})
        ])

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Crew deleted successfully",
            }
        })
    } catch (error) {
        console.error(error)
        res.send({
            status:"INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                message:"An error occurred while deleting image",
            }
        })
    }
}

const UPDATE_TASK = async (req, res) => {
    try {

        const {taskId} = req.params

        const {remarks, description, percentageDone} = req.body

        const findTask = await Task.findOne({taskId:taskId})

        if(!findTask || findTask === undefined || findTask === null) {
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"No Task found"
                }
            })
        }

        const updateTask = await Task.updateOne({taskId:taskId}, {$set: {remarks:remarks, description: description, percentageDone:percentageDone}})

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Updated task successfully"
            }
        })
    } catch (error) {
        console.error(error)
        res.send({
            status:"INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                message:"An error occurred while updating Task",
            }
        })
    }
}

const DOWNLOAD_WEEKLY_REPORT = async (req, res) =>{
    try {
       const {projectId} = req.params;
       const today = new Date();
       const lastSunday = endOfWeek(today, { weekStartsOn: 0 });
 
       const findDtr = await Dtr.find({
           projectId: projectId,
           createdAt: { $gte: startOfWeek(today, { weekStartsOn: 0 }), $lte: lastSunday }
       });
       const crewIds = findDtr.map(crewId => crewId.crewId)
       const findCrew = await Crew.find({crewId: {$in: crewIds}})
       
       const rows = []; // Initialize an array to store the rows of the CSV file
       const headers = ['name', 'weeklyHoursLate', 'weeklyOverTime', 'weeklyHoursWork', 'weeklyUndertime', 'weeklySalary',];
       // Define the headers of the CSV file
       
       // Iterate through the crew members and compute the required values
       for (let i = 0; i < findCrew.length; i++) {
          const crew = findCrew[i];
          const crewDtr = findDtr.filter(dtr => dtr.crewId === crew.crewId);
          const weeklyHoursLate = crewDtr.reduce((total, dtr) => total + dtr.dailyLateHours, 0);
          const weeklyOverTime = crewDtr.reduce((total, dtr) => total + dtr.dailyOverTime, 0);
          const weeklySalary = crewDtr.reduce((total, dtr) => total + dtr.totalSalary, 0);
          const weeklyHoursWork = crewDtr.reduce((total, dtr) => total + dtr.dailyHoursWork, 0);
          const weeklyUndertime = crewDtr.reduce((total, dtr) => total + dtr.dailyUnderTime, 0);
          const name = crew.firstName + ' ' + crew.lastName;
          rows.push([name, weeklyHoursLate, weeklyOverTime, weeklySalary, weeklyHoursWork, weeklyUndertime]);
       }
 
       // Use the fast-csv package to generate the CSV file and send it in the response
       const filePath = path.join(os.homedir(), 'Downloads', 'weekly_salary.csv');
       res.setHeader('Content-Type', 'text/csv');
       res.setHeader('Content-Disposition', `attachment; filename=${filePath}`);
       csv.write(rows, { headers: headers }).pipe(fs.createWriteStream(filePath)).on('finish', () => {
         res.download(filePath);
       });
       
    } catch (error) {
       console.error(error)
       res.send({
          status:"INTERNAL SERVER ERROR",
          statusCode:500,
          response:{
             message:"An error occurred while downloading weekly report",
          }
       })
    }
}

const DOWNLOAD_SUMMARY = async (req, res)=>{
    try {
        const {projectId} = req.params;
        const findDtr = await Dtr.find({projectId: projectId,});
        const crewIds = findDtr.map(crewId => crewId.crewId)
        const findCrew = await Crew.find({crewId: {$in: crewIds}})
        
        const rows = []; // Initialize an array to store the rows of the CSV file
        const headers = ['name', 'weeklyHoursLate', 'weeklyOverTime', 'weeklyHoursWork', 'weeklyUndertime', 'weeklySalary',];
        // Define the headers of the CSV file
        
        // Iterate through the crew members and compute the required values
        for (let i = 0; i < findCrew.length; i++) {
           const crew = findCrew[i];
           const crewDtr = findDtr.filter(dtr => dtr.crewId === crew.crewId);
           const weeklyHoursLate = crewDtr.reduce((total, dtr) => total + dtr.dailyLateHours, 0);
           const weeklyOverTime = crewDtr.reduce((total, dtr) => total + dtr.dailyOverTime, 0);
           const weeklySalary = crewDtr.reduce((total, dtr) => total + dtr.totalSalary, 0);
           const weeklyHoursWork = crewDtr.reduce((total, dtr) => total + dtr.dailyHoursWork, 0);
           const weeklyUndertime = crewDtr.reduce((total, dtr) => total + dtr.dailyUnderTime, 0);
           const name = crew.firstName + ' ' + crew.lastName;
           rows.push([name, weeklyHoursLate, weeklyOverTime, weeklySalary, weeklyHoursWork, weeklyUndertime]);
        }
  
        // Use the fast-csv package to generate the CSV file and send it in the response
        const filePath = path.join(os.homedir(), 'Downloads', 'project-summary.csv');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${filePath}`);
        csv.write(rows, { headers: headers }).pipe(fs.createWriteStream(filePath)).on('finish', () => {
          res.download(filePath);
        });
        
     } catch (error) {
        console.error(error)
        res.send({
           status:"INTERNAL SERVER ERROR",
           statusCode:500,
           response:{
              message:"An error occurred while downloading weekly report",
           }
        })
     }
}


module.exports = {
    ADD_TASK,
    ADD_CREW_ACCOUNT,
    ADD_DAILY_REPORT,
    UPLOAD_IMAGE,
    GET_ALL_TASK,
    GET_PROJECT_BY_ID,
    GET_ALL_CREW_BY_PROJECT,
    GET_DAILY_REPORT_BY_ID,
    GET_IMAGE_BY_ID,
    GET_TASK_BY_ID,
    GET_ALL_DAILY_REPORT_BY_PROJECT,
    GET_DAILY_REPORT_BY_DATE,
    GET_IMAGE_BY_PROJECT_ID,
    EDIT_TASK,
    EDIT_DAILY_REPORT,
    EDIT_IMAGE,
    DELETE_TASK,
    DELETE_DAILY_REPORT,
    DELETE_IMAGE_BY_ID,
    DELETE_CREW,
    UPDATE_TASK,
    DOWNLOAD_WEEKLY_REPORT,
    DOWNLOAD_SUMMARY
}