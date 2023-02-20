const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const imageSchema = new Schema({
    imageName: {
        type: String,
        required: true
    },
    caption: {
        type: String,
        required: true
     },
    date: {
        type: Number,
        required: true
    },
    projectId: {
        type:Number,
        ref: 'projects'
    }
})

module.exports = Image = mongoose.model('image', imageSchema);