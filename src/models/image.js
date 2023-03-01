const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AutoIncrement = require('mongoose-sequence')(mongoose);

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
        type:Number,
        ref: 'projects'
    }
})

imageSchema.plugin(AutoIncrement, {inc_field: 'imageId'});

module.exports = Image = mongoose.model('image', imageSchema);