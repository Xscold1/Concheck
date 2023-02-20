const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const dailyReportSchema = new Schema({
    tasks:{
        taskName: {
            type: String,
            required: true
        },
        startDate:{
            type: Date,
            required: true
        },
        endDate:{
            type: Date,
            required: true
        }
    },
    remarks: {
        type: String,
        required: true
    },
    weatherReport: {
        type: String,
        required: true
     },
    delay: {
        type: Number,
        required: true
    },
    hoursDelay:{
        type: Number,
        required: true
    },
    projectId: {
        type:Number,
        ref: 'projects'
    }
})

module.exports = DailyReport = mongoose.model('dailyReport', dailyReportSchema);