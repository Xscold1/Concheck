const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AutoIncrement = require('mongoose-sequence')(mongoose);

const  engineerSchema = new Schema({
    _id:{
        type:Number,
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
    userId:{
        type: Number,
        ref: 'users',
    }
}, { _id: false })

engineerSchema.plugin(AutoIncrement, { id : 'engineer_id_counter' , inc_field: '_id'})

module.exports = Engineer = mongoose.model('Engineer', engineerSchema);