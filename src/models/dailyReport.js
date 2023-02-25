const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const dailyReportSchema = new Schema({
    remarks: {
        type: String,
        required: true
    },
    weatherReport: {
        type: String,
        required: true
     },
    causeOfDelay: {
        type: String,
        required: true
    },
    hoursDelay:{
        type: Number,
        required: true
    },
    date:{
        type:Date,
        required: true
    },
    projectId: {
        type:mongoose.Schema.Types.ObjectId,
        ref: 'projects'
    },
    taskId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'task'  
    }
})

module.exports = DailyReport = mongoose.model('dailyReport', dailyReportSchema);