const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AutoIncrement = require('mongoose-sequence')(mongoose);

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
        type:Number,
        ref: 'project',
    },
    companyId:{
        type:Number,
        ref: 'company',
    },
    engineerId:{
        type:Number,
        ref: 'engineer',
    },
    taskId:{
        type:Number,
        ref:'task'  
    }
})
dailyReportSchema.plugin(AutoIncrement, {inc_field: 'dailyReportId'});
module.exports = DailyReport = mongoose.model('dailyReport', dailyReportSchema);