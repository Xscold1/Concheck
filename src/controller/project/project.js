
//import
const mongoose = require('mongoose');
const conn = mongoose.connection;
const bcrypt = require('bcrypt');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const {format, parse} = require('date-fns');
const path = require('path');
const os = require('os');

//models
const Project = require('../../models/project');
const Image = require('../../models/image');
const Crew = require('../../models/crew');
const User = require('../../models/user');
const Task = require('../../models/task');
const DailyReport = require('../../models/dailyReport');

//utils
const cloudinary = require('../../utils/cloudinary')

//global variables
const saltRounds = 10

const ADD_TASK = async (req, res) => {
    try {
        const {taskName,startDate, endDate, _id} = req.body;
        
        const addTask = await Task.create({
            taskName:taskName,
            startDate:startDate,
            endDate:endDate,
            projectId: _id,
        }).catch((error) =>{
            console.error(error);
            throw new Error("Failed to create Crew account");
        })
        
        if(!addTask){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Failed to add task"
                }
            })
        }

        res.send({
            status:"SUCCESS",
                statusCode:200,
                response:{
                    message:"Task added successfully"
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

const ADD_DAILY_REPORT = async (req,res)=>{
    try {
        const {projectId} = req.params
        const {remarks, weatherReport, causeOfDelay, hoursDelay} = req.body

        const insertDailyReport = await DailyReport.create({
            remarks:remarks,
            weatherReport:weatherReport,
            causeOfDelay:causeOfDelay,
            hoursDelay:hoursDelay,
            projectId: projectId,
            date:Date.now()
        }).catch((error) =>{
            console.error(error);
            throw new Error("Failed to create Crew account");
        })

        if(!insertDailyReport){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Failed to insert daily report"
                }
            })
        }

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Inserted daily report successfully"
            }
        })

    } catch (err) {
        res.send({
            status:"Internal Server Error",
            statusCode:500,
            response:{
                message:err.message
            }
        })
    }
}

const ADD_CREW_ACCOUNT = async (req, res) => {
    const session = await conn.startSession()
    try {

        session.startTransaction()
        const timeFormat = 'HH:mm';
        const dateFormat = 'dd-MM-yyyy'
        const {_id} = req.params
        const {email , password , startShift, endShift, dailyRate} = req.body

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
        
        const hashPassword = bcrypt.hashSync(password, saltRounds)

        const createCrewUserAccount = await User.create([{
            email:email, 
            password:hashPassword, 
            roleId:"4"
        }], {session})
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to create Crew account");
        })

        if(!createCrewUserAccount){
            throw new Error("Failed to create account")
        }

        let id = createCrewUserAccount.map(a => a._id)

        const createCrewAccount = await Crew.create([{
            dailyRate:dailyRate,
            startShift:startShift,
            endShift:endShift,
            userId:id[0],
            projectId:_id,
            hourlyRate: hourlyRate.toFixed(2),
        }], {session})
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to create Crew account");
        })

        if(!createCrewAccount){
            throw new Error("Failed to create account")
        }

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Account created Successfully"
            }
        })
        session.commitTransaction()
    } catch (err) {
        console.error(err);
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
        const {_id} = req.params
        const images = req.files;
        const captions = req.body.caption;
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
                projectId: _id,
                date: Date.now()
            });

            newImage.save()
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
    }
      
        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Uploaded image successfully"
            }
        })

    } catch (err) {
        res.send({
            status:"Internal Server Error",
            statusCode:500,
            response:{
                message:err.message
            }
        })
    }
}

const GET_ALL_TASK = async (req, res)=>{
    try {
        const {_id} = req.params

        const fetchAlltask = await Task.find({projectId: _id})
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to create Crew account");
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

        if(!fetchAlltask){
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
    } catch (err) {
        res.send({
            status:"Internal Server Error",
            statusCode:500,
            response:{
                message:err.message
            }
        })
    }
}

const GET_PROJECT_BY_ID = async (req, res) => {
    try {
        const {_id} = req.params

        const fetchProjectDetails = await Project.findById(_id)
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to create Crew account");
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
    } catch (err) {
        res.send({
            status:"Internal Server Error",
            statusCode:500,
            response:{
                message:err.message
            }
        })
    }
}

const GET_ALL_CREW_BY_PROJECT = async (req, res) => {
    try {
        const {_id} = req.params
        const fetchAllCrew = await Crew.find({projectId:_id}).populate('userId')
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to create Crew account");
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
        if(!fetchAllCrew){
            return res.send({
                status:"Failed",
                statusCode:400,
                response:{
                    message:"Failed to get crew details"
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
    } catch (err) {
        res.send({
            status:"Internal Server Error",
            statusCode:500,
            response:{
                message:err.message
            }
        })
    }
}

const GET_DAILY_REPORT_BY_ID = async (req, res) => {
    try {
        const {_id} = req.params
        const fetchDailyReport = await DailyReport.find({_id}).populate('taskId')
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to create Crew account");
        })

        if(!fetchDailyReport){
            return res.send({
                status:"Failed",
                statusCode:400,
                response:{
                    message:"Failed to fetch daily report"
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
    } catch (err) {
        res.send({
            status:"Internal Server Error",
            statusCode:500,
            response:{
                message:err.message
            }
        })
    }
}

const GET_TASK_BY_ID = async (req, res) => {
    try {
        const {taskId} = req.params
        const findTask = await Task.find({_id:taskId})
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to create Crew account");
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

const GET_ALL_DAILY_REPORT_BY_PROJECT = async (req, res) => {
    try {
        const {projectId} = req.params

        const findAllDailyReport = await DailyReport.find({projectId:projectId})
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to create Crew account");
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

    } catch (err) {
        return res.send({
            status:"INTERNAL SERVER ERROR",
            status:500,
            response:{
                message:err.message,
            }
        })
    }
}

const EDIT_TASK = async (req, res) => {
    try {
        const {taskId} = req.params
        const {taskName, startDate, endDate} = req.body
        const findTask = await Task.findByIdAndUpdate({_id: taskId},{$set:{taskName:taskName, startDate:startDate, endDate}})
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to create Crew account");
        })

        if(!findTask){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Failed to update task"
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

const EDIT_DAILY_REPORT = async (req, res) => {
    try {
        const {dailyReportId} = req.params
        const {remarks, weatherReport, causeOfDelay, hoursDelay} = req.body
        const updateDailyReport = await DailyReport.findByIdAndUpdate(dailyReportId,
            {$set:{
                remarks:remarks,
                weatherReport:weatherReport, 
                causeOfDelay:causeOfDelay, 
                hoursDelay:hoursDelay}
        })
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to create Crew account");
        })

        if(!updateDailyReport){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Failed to update daily report"
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
        res.send({
            status:"INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                message:err.message
            }
        })
    }
}

const DOWNLOAD_CSV_BY_PROJECT = async (req, res) => {
    try {
        //to ensure that the csv will be save on user download floder
        const DOWNLOAD_DIR = path.join(os.homedir(), 'Downloads');

        const {projectId} = req.params

        const now = new Date();
        const date = format(now, 'yyyy-MM-dd');
        const timeIn = format(now, 'HH:mm:ss');
        // Get all the CSV data from the database
        const csvData = await Csv.find({projectId})
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to create Crew account");
        })

        if(!csvData){
            return res.send({
                status: "FAILED",
                statusCode: 400,
                response: {
                    message: "No csv data found"
                }
            });
        }

        // Define the headers for the CSV file
        const csvHeaders = [
            { id: 'Name', title: 'Name' },
            { id: 'monday', title: 'Monday' },  
            { id: 'teusday', title: 'Tuesday' },
            { id: 'wednesDay', title: 'Wednesday' },
            { id: 'thursDay', title: 'Thursday' },
            { id: 'friday', title: 'Friday' },
            { id: 'totalHoursWork', title: 'Total Hours Worked' },
            { id: 'totalOverTimeHours', title: 'Total Overtime Hours' },
            { id: 'totalLateHours', title: 'Total Late Hours' },
        ];

        // Create the CSV writer with the defined headers
        const csvWriter = createCsvWriter({
            path: path.join(DOWNLOAD_DIR, `${date}-crewRecord.csv`),
            header: csvHeaders
        });

        // Write the CSV data to the file
        await csvWriter.writeRecords(csvData)
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to create Crew account");
        })

        return res.send({
            status: 'OK',
            statusCode: 200,
            response: {
                message: 'CSV file written successfully'
            }
        });
        

    } catch (error) {
        console.error(error)(error);
        return res.send({
            status: 'INTERNAL SERVER ERROR',
            statusCode: 500,
            response: {
            message: error.message
            }
        });
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
    GET_TASK_BY_ID,
    GET_ALL_DAILY_REPORT_BY_PROJECT,
    EDIT_TASK,
    EDIT_DAILY_REPORT,
    DOWNLOAD_CSV_BY_PROJECT
    
}