const { required } = require('joi');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const  Engineer = new Schema({
    firstName:{
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    licenseNumber: {
        type: Number,
        required:true
    },
})