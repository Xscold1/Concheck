const { required } = require('joi');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const crewSchema = new Schema({

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
        type:Number,
        ref: 'projects'
    },

    userId:{
        type: Number,
        ref: 'users',
    }
})

module.exports = Crew = mongoose.model('crew', crewSchema);