const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const companySchema = new Schema({
    imageUrl: {
        type: String,
    },
    companyName: {
        type: String,
        required: true
    },
     address: {
        type: String,
        required: true
     },
    contactNumber: {
        type: Number,
        required: true
    },
    userId:{
        type: Number,
        ref: 'User',
    }

})

module.exports = Company = mongoose.model('company', companySchema);