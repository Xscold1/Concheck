//imports
const mongoose = require('mongoose');
const conn = mongoose.connection;
const bcrypt = require('bcrypt');
const {format, parse} = require('date-fns');
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
        
        const now = new Date();

        const date = format(now, 'yyyy-MM-dd');
        
        const timeIn = format(now, 'HH:mm');

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
            timeIn: timeIn + 4,
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

        const timeOut = format(now, 'HH:mm');
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

        //actual computation
        let hoursOfWork = ((timeOutParse.getTime() - timeInParse.getTime()) / 3600000).toFixed(2);

        let hoursLate = 0
        let overTime = 0 
        let underTime = 0
        let lateComputation = 0
        let overTimeComputation = 0
        let weeklySalary = 0 
        if(timeInParse.getTime() > startShiftParse.getTime()){
            hoursLate = ((timeInParse.getTime() - startShiftParse.getTime()));
        }

        if( timeOutParse.getTime() > endShiftParse.getTime() ){
            overTime = ((endShiftParse.getTime() - timeOutParse.getTime()) / 3600000).toFixed(2);
        }

        if(timeOutParse.getTime() < endShiftParse.getTime() ){
            underTime = ((endShiftParse.getTime() - timeOutParse.getTime()) /3600000 ).toFixed(2)
        }

        if(timeOutParse.getTime() < startShiftParse.getTime()){
            hoursOfWork = 0 
        }
        
        //if totalHours and total Late is less than 30 mins then it will not be counted as late
        const totalHoursOfLate = isNaN(hoursLate) || hoursLate < .5 ? 0 : hoursLate;
        const totalOverTime = isNaN(overTime) || overTime > .5 ? 0 : overTime;

        if(totalHoursOfLate !== 0 ){
            lateComputation = ((findCrew.dailyRate) - (findCrew.hourlyRate * totalHoursOfLate))
        }

        if(totalOverTime !== 0){
            overTimeComputation = ((findCrew.dailyRate) + (findCrew.hourlyRate * totalOverTime))
        }
        
        let lateWeeklySalary = ((findCrew.hourlyRate * lateComputation))
        let underPayweeklySalary = ((findCrew.hourlyRate * underTime))
        let overTimeWeeklySalary = ((findCrew.hourlyRate * overTime))
        weeklySalary = ((findCrew.dailyRate + overTimeWeeklySalary) - (lateWeeklySalary + underPayweeklySalary))

        if(daysInWeek[now.getDay()] === 'saturday' || daysInWeek[now.getDay()] === 'sunday'){
            let remarks = ""
            if(hoursOfWork > 4){
                remarks = 'Present'
            }else if (hoursOfWork <= 4){
                remarks = 'halfDay'
            } 
        }

        let remarks = 'Absent'
        if(hoursOfWork > 4){
            remarks = 'Present'
        }else if (hoursOfWork <= 4){
            remarks = 'halfDay'
        }

        //update the dtr of crew
        const updateDtr = await Dtr.findOneAndUpdate({date: date, crewId: crewId}, {$set: {timeOut: timeOut}})
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed While updating Dtr");
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
                [checkIfTimeInExist.dayToday]: remarks,
                totalHoursWork:parseInt(hoursOfWork),
                weeklySalary: weeklySalary
            });
            await newCsvRecord.save();
        } else {
            //update the database if the user is already on the csv record
            const updateCsvRecord = await Csv.updateOne({crewId: crewId}, {$set:{
                [checkIfTimeInExist.dayToday]: remarks,
                totalHoursWork: csvRecord.totalHoursWork ? csvRecord.totalHoursWork + parseInt(hoursOfWork) : parseInt(hoursOfWork),
                totalOverTimeHours:csvRecord.totalOverTimeHours ? csvRecord.totalOverTimeHours + parseInt(totalOverTime) : parseInt(totalOverTime),
                totalLateHours: csvRecord.totalLateHours ? csvRecord.totalLateHours + parseInt(totalHoursOfLate) : parseInt(totalHoursOfLate),
                weeklySalary: csvRecord.weeklySalary ? csvRecord.weeklySalary + weeklySalary : weeklySalary
            }})
            .catch((error) =>{
                console.error(error);
                throw new Error("Failed to create Crew account");
            })
        }
        
        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Successfully log"
            }
        })

    } catch (error) {
        console.log(error)
        return res.send({
            status: "INTERNAL_SERVER_ERROR",
            statusCode:500,
            response:{
                messsage: "Failed to time out"
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