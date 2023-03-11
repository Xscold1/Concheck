//imports
const mongoose = require('mongoose');
const conn = mongoose.connection;
const bcrypt = require('bcrypt');
const {format, parse, differenceInHours} = require('date-fns');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const os = require('os');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;


//models
const Crew = require('../../models/crew')
const User = require('../../models/user')
const Dtr = require('../../models/dtr')

//utils
const cloudinary = require('../../utils/cloudinary');

//global variables
const saltRounds = 10

const UPDATE_CREW_ACCOUNT_DETAILS = async (req, res) => {
    const session = await conn.startSession();
    try {
        session.startTransaction();
        const {crewId} = req.params
        
        const crewInputInfo = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            address: req.body.address,
            contactNumber: req.body.contactNumber,
        } 

        const userAccountDetails = {
            password: req.body.password,
        }
        const hashPassword = bcrypt.hashSync(userAccountDetails.password, saltRounds)
        const findCrew = await Crew.findOne({crewId: crewId})

        if(!findCrew || findCrew === undefined || findCrew === null) {
            return res.send({
                status: "FAILED",
                statusCode:400,
                response:{
                    message: "Crew does not exist"
                }
            })
        }

        const updatePassword = await User.findOneAndUpdate({userId:findCrew.userId},{password:hashPassword})
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed To Update Account Details");
        })

        if(!updatePassword){
            return res.send({
                status: "FAILED",
                statusCode:400,
                response:{
                    message: "Failed to update user Account Details"
                }
            })
        }

        if(!req.file){
            const updateCrewAccountDetails = await Crew.findOneAndUpdate({crewId: crewId}, {$set:{
                ...crewInputInfo,
                }
            })
            .catch((error) =>{
                console.error(error);
                throw new Error("Failed To Update Account Details");
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
        const updateCrewAccountDetails = await Crew.findOneAndUpdate({crewId: crewId}, {$set:{
                ...crewInputInfo,
                imageUrl: uploadImage.url
            }
        })
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed To Update Account Details");
        })
        

        res.send({
            status: "Success",
            statusCode:200,
            response:{
                message: "Successfully Updated Account Details"
            }
        })
    } catch (error) {
        console.error(error);
        return res.send({
            status: "INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                message: "Failed To Update Account Details"
            }
        })
    }
}

const TIMEIN = async (req, res) =>{
    try {
        const daysInWeek = {
            "0": 'sunday',
            "1": 'monday',
            "2": 'tuesday',
            "3": 'wednesday',
            "4": 'thursday',
            "5": 'friday',
            "6": 'saturday'
        }
        const {crewId} = req.params

        function addHours(date, hours) {
            date.setHours(date.getHours() + hours);
          
            return date;
          }
        
        const now = new Date();

        const date = format(now, 'yyyy-MM-dd');

        const newDate = addHours(now, 8);
        
        const timeIn = format(newDate, 'HH:mm');

        const existingDtr = await Dtr.findOne({crewId: crewId, date: date})

        const findCrew = await Crew.findOne({crewId: crewId})

        if(!findCrew || findCrew === undefined || findCrew===null){
            return res.json({status: 'FAILED', statusCode: 400, message: "Crew does not exist"});
        }

        if(existingDtr){
            return res.send({
                status:"FAILED",
                statusCode: 200,
                response:{
                    message:"already time in today"
                }
            })
        }
        
        const newCrewTimeIn = new Dtr({
            timeIn: timeIn,
            date: date,
            crewId: crewId,
            projectId: findCrew.projectId,
            dayToday: daysInWeek[now.getDay()],
            totalSalary: 0
        })

        await newCrewTimeIn.save()
        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Log Successfully"
            }
        })

    } catch (error) {
        console.error(error);
        return res.send({
            status: "INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                messsage: "Failed to create time in record"
            }
        })
    }
}

const TIMEOUT = async (req, res) =>{
    try {
        const {crewId} = req.params

        //date formats
        const now = new Date();
        const date = format(now, 'yyyy-MM-dd');
        function addHours(date, hours) {
            date.setHours(date.getHours() + hours);
          
            return date;
          }
        const newDate = addHours(now, 8);

        // const timeOut = format(newDate, 'HH:mm');
        const timeOut = format(newDate, 'HH:mm');
        const timeFormat = 'HH:mm';

        //update Dtr to accept Timeout and be use
        const findCrew = await Crew.findOne({crewId:crewId})

        if(!findCrew){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Crew does not exist"
                }
            })
        }
        
        const checkIfTimeInExist = await Dtr.findOne({date: date, crewId: crewId})

        if(!checkIfTimeInExist){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Dtr do not exist"
                }
            })
        }
        //check if the crew has already time out for the day
        if(checkIfTimeInExist.timeOut !== undefined){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Already time out for today"
                }
            })
        }

        //parse date and time for computation
        const timeInParse = parse(checkIfTimeInExist.timeIn, timeFormat, new Date());
        const timeOutParse = parse(timeOut, timeFormat, new Date());
        const startShiftParse = parse(findCrew.startShift, timeFormat, new Date());
        const endShiftParse = parse(findCrew.endShift, timeFormat, new Date());

        let isLate = false;
        let isUnderpay = false;
        let isOverTime = false;

        //check if crew is late
        if (timeInParse > startShiftParse) {
            isLate = true;
        }

        //check if crew is underpaid
        if (timeOutParse < endShiftParse) {
            isUnderpay = true;
        }

        //check if crew has overtime
        if (timeOutParse > endShiftParse) {
            isOverTime = true;
        }

        //compute total hours worked
        const hoursOfWork = (differenceInHours(timeOutParse, timeInParse) - 1);
        
        let overTimeHours = 0;
        let hoursLate = 0
        let underTime = 0
        let dailySalary = 0
        //compute weekly salary based on hourly rate or daily rate
        if (findCrew.hourlyRate) {
        const hourlyRate = findCrew.hourlyRate;
        dailySalary = hoursOfWork * hourlyRate;

            //check if there is overtime
            if (isOverTime) {
                overTimeHours = differenceInHours(timeOutParse, endShiftParse)
                overTimePay = (overTimeHours * hourlyRate);
                dailySalary += overTimePay;
            }
                //compute late penalty
            if (isLate) {
                hoursLate = differenceInHours(timeInParse, startShiftParse)
                let latePenalty = (hoursLate * hourlyRate)
                dailySalary -= latePenalty;
            }

                //compute underpay penalty
            if (isUnderpay) {
                underTime = differenceInHours(timeOutParse, endShiftParse)
                let underTimePenalty = (underTime * hourlyRate)
                dailySalary -= underTimePenalty;
            }
        }

        //update Dtr to reflect time out
        const updateDtr = await Dtr.updateOne({date: date, crewId: crewId}, 
            {$set:{
                timeOut: timeOut,
                dailySalary: dailySalary,
                dailyHoursWork:hoursOfWork,
                dailyLateHours:hoursLate,
                dailyOverTime:overTimeHours,
                dailyUnderTime:underTime,
                totalSalary: checkIfTimeInExist.totalSalary + dailySalary,
            }
        })
    
        return res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Time out successfully recorded",
            }
        })

    } catch (error) {
        console.error(error)
        return res.send({
            status:"FAILED",
            statusCode:500,
            response:{
                message:"An error occured while trying to record time out"
            }
        })
    }           
}

const GET_CREW_BY_ID = async (req, res) => {
    try {
        const {crewId} = req.params

        const fetchCrewDetails = await Crew.findOne({crewId: crewId})
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to find crew account details");
        })

        if(!fetchCrewDetails){
            return res.send({
                status: "FAILED",
                statusCode:500,
                response:{
                    message:"Account does not exist",
                }
            })
        }
        const fetchCrewUserDetails = await User.findOne({userId:fetchCrewDetails.userId})
        
        res.send({
            status: "SUCCESS",
            statusCode:200,
            response:{
                message:"Successfully fetch data",
                data: {
                    imageUrl:fetchCrewDetails.imageUrl,
                    firstName:fetchCrewDetails.firstName,
                    lastName:fetchCrewDetails.lastName,
                    address:fetchCrewDetails.address,
                    contactNumber:fetchCrewDetails.contactNumber,
                    startShift:fetchCrewDetails.startShift,
                    endShift:fetchCrewDetails.endShift,
                    dailyRate:fetchCrewDetails.dailyRate,
                    hourlyRate:fetchCrewDetails.hourlyRate,
                    email:fetchCrewUserDetails.email,
                    password:fetchCrewUserDetails.password
                }
            }
        })
        
    } catch (error) {
        console.error(error)
        return res.send({
            status: "INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                messsage: "Failed to find crew account details"
            }
        })
    }
}

const GET_DTR_BY_CREW_ID = async (req, res) => {
    try {
        const daysInWeek = {
            "0": 'sunday',
            "1": 'monday',
            "2": 'tuesday',
            "3": 'wednesday',
            "4": 'thursday',
            "5": 'friday',
            "6": 'saturday'
        }
        const now = new Date();
        const {crewId} = req.params

        const findDtr = await Dtr.findOne({crewId:crewId, dayToday: daysInWeek[now.getDay()]})
            
        if(!findDtr){
            return res.send({
                status: "FAILED",
                statusCode:400,
                response:{
                    messsage: "No  dtr records found"
                }
            })
        }

        res.send({
            status: "SUCCESS",
            statusCode:200,
            response:{
                messsage: "Success",
                data:{
                    timein: findDtr.timeIn,
                    timeout: findDtr.timeOut === {} || findDtr.timeOut ? findDtr.timeOut : "N/A"
                }
            }
        })
    } catch (error) {
        console.error(error)
        res.send({
            status: "INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                messsage: "Failed to get timein timeout details"
            }
        })
    }
}

const DOWNLOAD_DTR = async (req, res) => {
    
    try {
        const { crewId } = req.params;
        const findCrew = await Crew.findOne({ crewId }); // Find the specific crew member
        const data = await Dtr.find({ crewId }); // Find all Dtr records for the specified crewId
        let totalSalary = 0;
        
        // Calculate the total salary for the crew member
        for (let i = 0; i < data.length; i++) {
            totalSalary += data[i].dailySalary;
        }
        
        // Add the total salary to the data array
        data.push({totalSalary: totalSalary});

        const csvWriter = createCsvWriter({
            path: `${findCrew.firstName}-${findCrew.lastName}-dtr.csv `,
            header: [
                {id: 'timeIn', title: 'Time In'},
                {id: 'timeOut', title: 'Time Out'},
                {id: 'date', title: 'Date'},
                {id: 'dayToday', title: 'Day Today'},
                {id: 'dailySalary', title: 'Daily Salary'},
                {id: 'totalSalary', title: 'Total Salary'},
            ]
        });

        csvWriter.writeRecords(data)
        .then(() => {
            res.download(`${findCrew.firstName}-${findCrew.lastName}-dtr.csv`);
        })
        .catch((err) => {
            console.log('Error writing CSV file: ', err);
            res.send({
                status: "FAILED",
                statusCode:400,
                response:{
                    messsage: "An error occurred while downloading csv"
                }
            })
        });
    } catch (err) {
        console.error(err)
        res.send({
            status: "INTERNAL SERVER ERROR",
            statusCode:500,
            response:{
                messsage: "An error occurred while downloading csv"
            }
        })
    }
}

module.exports = {
    UPDATE_CREW_ACCOUNT_DETAILS,
    TIMEIN,
    TIMEOUT,
    GET_CREW_BY_ID,
    GET_DTR_BY_CREW_ID,
    DOWNLOAD_DTR
}