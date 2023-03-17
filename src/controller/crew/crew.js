//imports
const mongoose = require('mongoose');
const conn = mongoose.connection;
const bcrypt = require('bcrypt');
const csv = require('fast-csv');
const {format, parse, differenceInHours, setHours} = require('date-fns');
const _ = require('lodash');
const concat = require('concat-stream');
// const fastcsv = require('fast-csv'); // Import fast-csv module

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

        if(!req.file){
            const updateCrewAccountDetails = await Crew.findOneAndUpdate({crewId: crewId}, {$set:{
                ...crewInputInfo,
                }
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
        const noon = setHours(now, 12);

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
        let hoursOfWork = (differenceInHours(timeOutParse, timeInParse) - 1);
        
        let overTimeHours = 0;
        let hoursLate = 0
        let underTime = 0
        let dailySalary = 0
        //compute weekly salary based on hourly rate or daily rate
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

        if(hoursOfWork < 0 ){
            hoursOfWork = 0
        }

        let remarks = ""

        if(hoursOfWork !== 0){
            remarks = "Present"
        }

        if(isLate) {
            remarks = "Late"
        }

        if(timeInParse === noon){
            remarks = "Half Day"
        }

        if(dailySalary < 0) {
            dailySalary = 0
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
                remarks: remarks,
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

// const DOWNLOAD_DTR_FAST = async (req, res) => {
    
//     try {
//         const { crewId } = req.params;
//         const findCrew = await Crew.findOne({ crewId }).exec(); // Find the specific crew member
//         const data = await Dtr.find({ crewId }).exec(); // Find all Dtr records for the specified crewId
//         let totalSalary = 0;

//         console.log()
        
//         // Calculate the total salary for the crew member
//         for (let i = 0; i < data.length; i++) {
//             totalSalary += data[i].dailySalary;
//         }
        
//         // Add the total salary to the data array
//         data.push({totalSalary: totalSalary});

//         const downloadsFolder = path.join(os.homedir(), 'Downloads');

//         const fileName = `${findCrew.firstName}-${findCrew.lastName}-dtr.csv `
//         const headers = ['time in', 'time out', 'date', 'day', 'remarks','dailySalary','totalSalary',];

//         // Initialize an array to store the rows of the CSV file
//         const rows = [];

//         // Iterate through the Dtr records and add the data to the rows array
//         for (let i = 0; i < data.length; i++) {
//             const dtr = data[i];
//             rows.push([
//                 dtr.timeIn,
//                 dtr.timeOut,
//                 dtr.date,
//                 dtr.dayToday,
//                 dtr.remarks,
//                 dtr.dailySalary,
//                 dtr.totalSalary || totalSalary,
//             ]);
//         }

//         // Use fast-csv to generate the CSV file and send it in the response
//         const filePath = path.join(os.homedir(), 'Downloads', `${crewId}-dtr.csv`);
//         res.setHeader('Content-Type', 'text/csv');
//         res.setHeader('Content-Disposition', `attachment; filename=${filePath}`);
//         csv.write(rows, { headers: headers }).pipe(fs.createWriteStream(filePath)).on('finish', () => {
//             res.download(filePath);
//           });

//     } catch (err) {
//         console.error(err)
//         res.send({
//             status: "INTERNAL SERVER ERROR",
//             statusCode:500,
//             response:{
//                 messsage: "An error occurred while downloading csv"
//             }
//         })
//     }
// }

const DOWNLOAD_DTR_FAST = async (req, res) => {
    try {
      const { crewId } = req.params;
      const findCrew = await Crew.findOne({ crewId }).exec();
      const data = await Dtr.find({ crewId }).exec();
      let totalSalary = 0;
  
      for (let i = 0; i < data.length; i++) {
        totalSalary += data[i].dailySalary;
      }
  
      data.push({ totalSalary: totalSalary });
  
      const fileName = `${findCrew.firstName}-${findCrew.lastName}-dtr.csv`;
      const headers = [
        "time in",
        "time out",
        "date",
        "day",
        "remarks",
        "dailySalary",
        "totalSalary",
      ];
  
      const rows = [];
  
      for (let i = 0; i < data.length; i++) {
        const dtr = data[i];
        rows.push([
          dtr.timeIn,
          dtr.timeOut,
          dtr.date,
          dtr.dayToday,
          dtr.remarks,
          dtr.dailySalary,
          dtr.totalSalary || totalSalary,
        ]);
      }
  
      const csvData = await new Promise((resolve, reject) => {
        csv.write(rows, { headers: headers }).pipe(concat((data) => {
          resolve(data.toString());
        })).on('error', (error) => {
          reject(error);
        });
      });
  
      return res.send({
        status: "SUCCESS",
        statusCode: 200,
        response: {
          data: csvData
        }
      });

    } catch (err) {
      console.error(err);
      res.send({
        status: "INTERNAL SERVER ERROR",
        statusCode: 500,
        response: {
          messsage: "An error occurred while uploading csv"
        }
      });
    }
  };
  
  




module.exports = {
    UPDATE_CREW_ACCOUNT_DETAILS,
    TIMEIN,
    TIMEOUT,
    GET_CREW_BY_ID,
    GET_DTR_BY_CREW_ID,
    DOWNLOAD_DTR_FAST
}