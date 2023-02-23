const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
            type: mongoose.Schema.Types.ObjectId,
            ref: 'project',
        }
})

module.exports = Task = mongoose.model('task', taskSchema);