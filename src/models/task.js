const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AutoIncrement = require('mongoose-sequence')(mongoose);

const taskSchema = new Schema({
    taskName: {
        type: String,
        required: true
    },
    startDate:{
        type: Date,
        required: true
    },
    endDate:{
        type: Date,
        required: true
    },
    projectId: {
        type:Number,
        ref: 'project',
    },
})

taskSchema.plugin(AutoIncrement, {inc_field: 'taskId'});

module.exports = Task = mongoose.model('task', taskSchema);