const { number } = require('joi');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AutoIncrement = require('mongoose-sequence')(mongoose);

const projectSchema = new Schema({
    _id:{
        type:Number,
    },
    image:{
        type:String,
        required:true,
    },
    projectName:{
        type:String,
        required:true,
    },
    startDate:{
        type:Number,
        required:true,
    },
    endDate:{
        type:Number,
        required:true,
    },
    projectEngineer:{
        type:String,
        required:true,
    },
    siteEngineer:{
        type:String,
        required:true,
    },
    safetyOfficer:{
        type:String,
        required:true,
    },
    projectCode:{
        type:Number,
        required:true,
    },
    status:{
        type:String,
        required:true,
    },
    budget:{
        type:Number,
        required:true,
    },
}, { _id: false })

projectSchema.plugin(AutoIncrement, { id : 'project_id_counter' , inc_field: '_id'})

module.exports = project = mongoose.model('project', projectSchema);