const { number } = require('joi');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AutoIncrement = require('mongoose-sequence')(mongoose);

const projectSchema = new Schema({

    imageUrl: {
        type: String,
        required: true,
    },
    projectName:{
        type:String,
        required:true,
        unique:true,
    },
    startDate:{
        type:Date,
        required:true,
    },
    endDate:{
        type:Date,
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
    projectEngineerId:{
        type: mongoose.Schema.Types.ObjectId
    }
})


module.exports = project = mongoose.model('project', projectSchema);