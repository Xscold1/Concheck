const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AutoIncrement = require('mongoose-sequence')(mongoose);

const userSchema = new Schema({
    _id:{
        type:Number,
    },
    email:{
        type: String,
        required: true,
    },
    password:{
        type: String,
        required: true,
    },
    roleId:{
        type: Number,
        required: true,
    }
}, { _id: false })

userSchema.plugin(AutoIncrement, {  id : 'userSchema_id_counter' ,inc_field: '_id'})

module.exports = User = mongoose.model('User', userSchema);
