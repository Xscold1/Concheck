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
        ref:"company"
    },
    userId:{
        type: Number,
        ref: 'User',
    }
})

engineerSchema.plugin(AutoIncrement, {inc_field: 'engineerId'});

module.exports = Engineer = mongoose.model('Engineer', engineerSchema);