const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AutoIncrement = require('mongoose-sequence')(mongoose);

const crewSchema = new Schema({

    imageUrl: {
        type: String,
    },

    firstName:{
        type: String,
    },

    lastName: {
        type: String,
    },

    address: {
        type: String,
    },

    contactNumber: {
        type: String,
    },

    startShift:{
        type: String,
        required: true
    },

    endShift:{
        type: String,
        required: true
    },

    dailyRate:{
        type:Number,
        required: true
    },
    
    hourlyRate:{
        type:Number,
        required: true
    },

    remarks:{
        type:String,
    },

    projectId: {
        type:Number,
        ref: 'projects'
    },

    companyId:{
        type:Number,
        required: true
    },
    
    userId:{
        type: Number,
        ref: 'User',
    }
})

crewSchema.plugin(AutoIncrement, {inc_field: 'crewId'});

module.exports = Crew = mongoose.model('crew', crewSchema);