const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const imageSchema = new Schema({
    imageUrl:{
        type:String
    },
    caption: {
        type: String,
     },
    date: {
        type: Date,
        required: true
    },
    projectId: {
        type:mongoose.Schema.Types.ObjectId,
        ref: 'projects'
    }
})

module.exports = Image = mongoose.model('image', imageSchema);