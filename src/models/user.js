const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AutoIncrement = require('mongoose-sequence')(mongoose);

const userSchema = new Schema({
    email:{
        type: String,
        required: true,
    },
    password:{
        type: String,
        required: true,
        min: 4,
        max: 16
    },
    
    roleId:{
        type: String,
        required: true,
    },
    userId:{
        type: Number
    }
})

userSchema.plugin(AutoIncrement, {inc_field: 'userId'});

module.exports = User = mongoose.model('User', userSchema);
