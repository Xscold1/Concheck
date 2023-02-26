const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const csvSchema = new Schema({
    Name: {
        type:String,
    },
    monday:{
        type: Number,
        default:0
   },

    teusday:{
        type:Number,
        default:0
    },

    wednesDay:{
        type:Number,
        default:0
    },

    thursDay:{
        type:Number,
        default:0
    },

    friday:{
        type:Number,
        default:0
    },

    totalHoursWork:{
        type:Number,
        default:0
    },

    totalOverTimeHours:{
        type:Number,
        default:0
    },

    totalLateHours:{
        type:Number,
        default:0
    },

    rate:{
        type:Number,
    },

    weeklySalary:{
        type:Number,
        default:0
    },

    crewId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:('crew')
    },
    porojectId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:('project')
    },

})

module.exports = Csv = mongoose.model('csv', csvSchema);