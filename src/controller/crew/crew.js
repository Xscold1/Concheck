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
            console.error;
            return res.send({
                status: "FAILED",
                statusCode: 500,
                response: {
                    message: error.message
                }
            });
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
            console.error;
            return res.send({
                status: "FAILED",
                statusCode: 500,
                response: {
                    message: error.message
                }
            });
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
            console.error;
            return res.send({
                status: "FAILED",
                statusCode: 500,
                response: {
                    message: error.message
                }
            });
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
            console.error;
            return res.send({
                status: "FAILED",
                statusCode: 500,
                response: {
                    message: error.message
                }
            });
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
            console.error;
            return res.send({
                status: "FAILED",
                statusCode: 500,
                response: {
                    message: error.message
                }
            });
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

        //parase time in time out for computation
        const timeInParse = parse(checkIfTimeInExist.timeIn, timeFormat, new Date());
        const timeOutParse = parse(timeOut, timeFormat, new Date());

        //compute tottal work hours
        const timeDiffMs = timeOutParse.getTime() - timeInParse.getTime();
        const hoursOfWork = timeDiffMs / 3600000;
        
        //compute total late hours
        const startShiftParse = parse(checkIfTimeInExist.crewId.startShift, timeFormat, new Date());
        const lateHoursComputation = timeInParse.getTime() - startShiftParse.getTime()

        //compute overTime 
        const endShiftParse = parse(checkIfTimeInExist.crewId.endShift, timeFormat, new Date());
        const overTimeHoursComputation = endShiftParse.getTime() - timeOutParse.getTime() 

        //compute so that the overtime hours is not in milliseconds but in hours
        const overTime = overTimeHoursComputation/ 3600000
        const hoursLate = lateHoursComputation/ 3600000

        const parseOverTime = parseInt(overTime)
        const parseHoursLate = parseInt(hoursLate)
        const parseHoursOfWork = parseInt(hoursOfWork)

        //fixed the decimal to 1 decimal only
        let totalHoursOfLate = parseHoursLate.toFixed(1)
        if(totalHoursOfLate === NaN || totalHoursOfLate < 0){
            totalHoursOfLate = 0
        }
        
        let totalOverTime = parseOverTime.toFixed(1)
        if(totalOverTime === NaN || totalOverTime < 0){
            totalOverTime = 0
        }

        let hourseOfWork = parseHoursOfWork.toFixed(1)
        //update the dtr of crew

        const updateDtr = await Dtr.updateOne({crewId: crewId},
            {$set: {
                timeOut: timeOut,
                hoursOfWorkToday: hourseOfWork, 
                hoursOfLateToday: totalHoursOfLate, 
                hoursOfOverTimeToday: totalOverTime
            }})
            .catch((error) =>{
                console.error;
                return res.send({
                    status: "FAILED",
                    statusCode: 500,
                    response: {
                        message: error.message
                    }
                });
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
            console.error;
            return res.send({
                status: "FAILED",
                statusCode: 500,
                response: {
                    message: error.message
                }
            });
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
                rate: checkIfTimeInExist.crewId.rate,
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
                console.error;
                return res.send({
                    status: "FAILED",
                    statusCode: 500,
                    response: {
                        message: error.message
                    }
                });
            })
        }
        if(!updateCsvRecord){
            return res.send({
                status: "FAILED",
                statusCode: 400,
                response: {
                    message: "Failed to update CSV Record"
                }
            })
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
            console.error;
            return res.send({
                status: "FAILED",
                statusCode: 500,
                response: {
                    message: error.message
                }
            });
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