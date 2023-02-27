//imports
const mongoose = require('mongoose');
const conn = mongoose.connection;
const bcrypt = require('bcrypt');
const {format, parse} = require('date-fns');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;


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

        const uploadImage = await cloudinary.uploader.upload(req.file.path)
        const crewInputInfo = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            address: req.body.address,
            contactNumber: req.body.contactNumber,
        }

        const userAccountDetails = {
            password: req.body.password,
            _id: req.body._id
        }
        const hashPassword = bcrypt.hashSync(userAccountDetails.password, saltRounds)

        const updatePassword = await User.findOneAndUpdate(userAccountDetails._id,{password:hashPassword})
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed To Update Account Details");
        })

        if(!updatePassword){
            return res.send({
                status: "FAILED",
                statusCode:400,
                response:{
                    messsage: "Failed to update user Account Details"
                }
            })
        }
        
        const updateCrewAccountDetails = await Crew.findOneAndUpdate({userId: userAccountDetails._id}, {$set:{
                ...crewInputInfo,
                imageUrl: uploadImage.url
            }
        }).populate('userId')
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to create Crew account");
        }).exec()
        
        if(!updateCrewAccountDetails){
            return res.send({
                status: "FAILED",
                statusCode:400,
                response:{
                    messsage: "Failed to update crew Account Details"
                }
            })
        }

        res.send({
            status: "Success",
            statusCode:200,
            response:{
                messsage: "Successfully Updated Account Details"
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
        const timeIn = format(now, 'HH:mm:ss');
        
        
        const existingDtr = await Dtr.findOne({crewId: crewId, date: date})
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to create Crew account");
        })

        if(existingDtr){
            return res.send({
                status:"FAILED",
                statusCode: 200,
                response:{
                    message:"already time in today"
                }
            })
        }
        
        const newCrewTimeIn = new Dtr({timeIn: timeIn, date: date, crewId: crewId, dayToday: daysInWeek[now.getDay()]})
        

        await newCrewTimeIn.catch((error) =>{
            console.error(error);
            throw new Error("Failed to create Crew account");
        }).save()

        if(!newCrewTimeIn){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Failed to timein"
                }
            })
        }

        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Log Successfully"
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

const TIMEOUT = async (req, res) =>{
    try {
        const {crewId} = req.params

        //date formats
        const now = new Date();
        const date = format(now, 'yyyy-MM-dd');
        const timeOut = format(now, 'HH:mm:ss');
        const timeFormat = 'HH:mm:ss';

        //update Dtr to accept Timeout and be use
        const checkIfTimeInExist = await Dtr.findOne({date: date, crewId: crewId}).populate('crewId')
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to create Crew account");
        })

        if(!checkIfTimeInExist){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"There is no timein record yet"
                }
            })
        }
        //check if the crew has already time out for the day
        if(checkIfTimeInExist.timeOut === {}){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"You have already timed out for the day"
                }
            })
        }

        const timeInParse = parse(checkIfTimeInExist.timeIn, timeFormat, new Date());
        const timeOutParse = parse(timeOut, timeFormat, new Date());
        const startShiftParse = parse(checkIfTimeInExist.crewId.startShift, timeFormat, new Date());
        const endShiftParse = parse(checkIfTimeInExist.crewId.endShift, timeFormat, new Date());

        const hoursOfWork = ((timeOutParse.getTime() - timeInParse.getTime()) / 3600000).toFixed(1);

        const hoursLate = ((timeInParse.getTime() - startShiftParse.getTime()) / 3600000).toFixed(1);

        const overTime = ((endShiftParse.getTime() - timeOutParse.getTime()) / 3600000).toFixed(1);


        const totalHoursOfLate = isNaN(hoursLate) || hoursLate < 0 ? 0 : hoursLate;
        const totalOverTime = isNaN(overTime) || overTime < 0 ? 0 : overTime;
        const hourseOfWork = parseInt(hoursOfWork).toFixed(1);

        //update the dtr of crew

        const updateDtr = await Dtr.updateOne({crewId: crewId},
            {$set: {
                timeOut: timeOut,
                hoursOfWorkToday: hourseOfWork, 
                hoursOfLateToday: totalHoursOfLate, 
                hoursOfOverTimeToday: totalOverTime
            }})
            .catch((error) =>{
                console.error(error);
                throw new Error("Failed to create Crew account");
            })

        if(!updateDtr){
            return res.send({
                status:"FAILED",
                statusCode:400,
                response:{
                    message:"Failed to update DTR"
                }
            })
        }

        //check if there is already a csv already has the crewId
        const csvRecord = await Csv.findOne({ crewId: crewId })
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to create Crew account");
        })
        if (!csvRecord) {
            // If the CSV record doesn't exist, create a new one
            const newCsvRecord = new Csv({
                Name:"vash",
                crewId:crewId,
                projectId: checkIfTimeInExist.crewId.projectId,
                [checkIfTimeInExist.dayToday]: hourseOfWork,
                totalHoursWork:hourseOfWork,
                totalOverTimeHours: totalOverTime,
                totalLateHours: totalHoursOfLate,
                hourlyRate: checkIfTimeInExist.crewId.hourlyRate,
                weeklySalary: 0
                
            });
        
            await newCsvRecord.save();
        } else {
            //update the database if the user is already on the csv record
            const updateCsvRecord = await Csv.updateOne({crewId: crewId}, {$set:{
                [checkIfTimeInExist.dayToday]: parseInt(hoursOfWork),
                totalHoursWork: csvRecord.totalHoursWork ? csvRecord.totalHoursWork + hourseOfWork : hourseOfWork,
                totalOverTimeHours:csvRecord.totalOverTimeHours ? csvRecord.totalOverTimeHours + totalOverTime : totalOverTime,
                totalLateHours: csvRecord.totalLateHours ? csvRecord.totalLateHours + totalHoursOfLate : totalHoursOfLate
            }})
            .catch((error) =>{
                console.error(error);
                throw new Error("Failed to create Crew account");
            })

            if(!updateCsvRecord){
                return res.send({
                    status: "FAILED",
                    statusCode: 400,
                    response: {
                        message: "Failed to update CSV Record"
                    }
                })
            }
        }
        
        res.send({
            status:"SUCCESS",
            statusCode:200,
            response:{
                message:"Successfully log"
            }
        })

    } catch (err) {
        return res.send({
            status: "INTERNAL_SERVER_ERROR",
            statusCode:500,
            response:{
                messsage: err.message
            }
        })
    }
}

const GET_CREW_BY_ID = async (req, res) => {
    try {
        const {_id} = req.params

        const fetchCrewDetails = await Crew.findById(_id).populate('userId')
        .catch((error) =>{
            console.error(error);
            throw new Error("Failed to create Crew account");
        })

        res.send({
            status: "SUCCESS",
            statusCode:200,
            response:{
                message:"Successfully fetch data",
                data: fetchCrewDetails
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
module.exports = {
    UPDATE_CREW_ACCOUNT_DETAILS,
    TIMEIN,
    TIMEOUT,
    GET_CREW_BY_ID
}