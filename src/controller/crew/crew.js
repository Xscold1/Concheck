//imports
const mongoose = require('mongoose');
const conn = mongoose.connection;
const bcrypt = require('bcrypt');
const {format, parse, differenceInHours, differenceInMinutes} = require('date-fns');
const _ = require('lodash');
const { parseFromTimeZone, formatToTimeZone } = require('date-fns-timezone')


//models
const Crew = require('../../models/crew')
const User = require('../../models/user')
const Dtr = require('../../models/dtr')
const Csv = require('../../models/csv')

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
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to find Existing Dtr");
        })

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
            dayToday: daysInWeek[now.getDay()]
        })

        await newCrewTimeIn.save()
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to find Existing Dtr");
        })

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

        const daysInWeek = {
            "0": 'sunday',
            "1": 'monday',
            "2": 'tuesday',
            "3": 'wednesday',
            "4": 'thursday',
            "5": 'friday',
            "6": 'saturday'
        }
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
        .catch((error) =>{
            console.error(error);
            throw new Error("An error occurred while trying to find crew");
        })

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
        .catch((error) =>{
            console.error(error);
            throw new Error("An error occured while trying to find dtr");
        })

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
        
        let weeklySalary = 0;
        let overTimeHours = 0;
        let hoursLate = 0
        //compute weekly salary based on hourly rate or daily rate
        if (findCrew.hourlyRate) {
        const hourlyRate = findCrew.hourlyRate;
        weeklySalary = hoursOfWork * hourlyRate;

            //check if there is overtime
            if (isOverTime) {
                overTimeHours = differenceInHours(timeOutParse)
                overTimeRate = hourlyRate * 1.5;
                overTimePay = (overTimeHours * overTimeRate);
                weeklySalary += overTimePay;
            }
                //compute late penalty
            if (isLate) {
                    const latePenaltyRate = hourlyRate / 2;
                    const latePenalty = (differenceInMinutes(timeInParse, startShiftParse) * (latePenaltyRate / 60));
                    weeklySalary -= latePenalty;
            }

                //compute underpay penalty
            if (isUnderpay) {
                    const underpayPenaltyRate = hourlyRate / 2;
                    const underpayPenalty = (differenceInMinutes(endShiftParse, timeOutParse) * (underpayPenaltyRate / 60));
                    weeklySalary -= underpayPenalty;
            }
        }

        console.log(weeklySalary)
        //update Dtr to reflect time out
        const updateDtr = await Dtr.updateOne({date: date, crewId: crewId}, {timeOut: timeOut})
        .catch((error) =>{
            console.error(error);
            throw new Error("An error occured while trying to update dtr");
        })

        //check if there is already a csv already has the crewId
        const csvRecord = await Csv.findOne({ crewId: crewId})
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to create Crew account");
        })

        if (!csvRecord) {
            // If the CSV record doesn't exist, create a new one
            const newCsvRecord = new Csv({
                Name:findCrew.firstName + '' + findCrew.lastName,
                crewId:crewId,
                projectId: checkIfTimeInExist.projectId,
                [checkIfTimeInExist.dayToday]: hoursOfWork,
                totalHoursWork:parseInt(hoursOfWork),
                weeklySalary: weeklySalary.toFixed(2)
            });
            await newCsvRecord.save();
        } else {
            //update the database if the user is already on the csv record
            const updateCsvRecord = await Csv.updateOne({crewId: crewId}, {$set:{
                [checkIfTimeInExist.dayToday]: hoursOfWork,
                totalHoursWork: csvRecord.totalHoursWork ? csvRecord.totalHoursWork + parseInt(hoursOfWork) : parseInt(hoursOfWork),
                totalOverTimeHours:csvRecord.totalOverTimeHours ? csvRecord.totalOverTimeHours + overTimeHours : overTimeHours,
                totalLateHours: csvRecord.totalLateHours ? csvRecord.totalLateHours + hoursLate : hoursLate,
                weeklySalary: csvRecord.weeklySalary.toFixed(2) ? csvRecord.weeklySalary.toFixed(2) + weeklySalary.toFixed(2) : weeklySalary.toFixed(2)
            }})
            .catch((error) =>{
                console.error(error);
                throw new Error("Failed to create csv");
            })
        }
    
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
        res.send({
            status: "SUCCESS",
            statusCode:200,
            response:{
                message:"Successfully fetch data",
                data: fetchCrewDetails
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
        .catch((error) =>{
            throw new Error("An error occurred while trying to fetch dtr data")
        })
            
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

module.exports = {
    UPDATE_CREW_ACCOUNT_DETAILS,
    TIMEIN,
    TIMEOUT,
    GET_CREW_BY_ID,
    GET_DTR_BY_CREW_ID
}