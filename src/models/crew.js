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
        type: Number,
        required: true
    },

    endShift:{
        type: Number,
        required: true
    },

    rate:{
        type:Number,
        required: true
    },

    earnings: {
        type: Number,
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