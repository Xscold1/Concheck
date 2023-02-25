const { required } = require('joi');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AutoIncrement = require('mongoose-sequence')(mongoose);

const  engineerSchema = new Schema({
    imageUrl: {
        type: String,
        required: true,
    },

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
        type: String,
        required:true
    },

    companyId:{
        type: Number,
        required:true,
        ref:"company"
    },

    userId:{
        type: Number,
        ref: 'User',
    }
})


module.exports = Engineer = mongoose.model('Engineer', engineerSchema);