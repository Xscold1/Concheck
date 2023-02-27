const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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

    projectId: {
        type:mongoose.Schema.Types.ObjectId,
        ref: 'projects'
    },

    userId:{
        type: Number,
        ref: 'User',
    }
})

module.exports = Crew = mongoose.model('crew', crewSchema);