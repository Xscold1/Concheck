const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const csvSchema = new Schema({
    Name: {
        type:String,
    },
    monday:{
        type: String,
        default:""
   },

    teusday:{
        type:String,
        default:""
    },

    wednesDay:{
        type:String,
        default:""
    },

    thursDay:{
        type:String,
        default:""
    },

    friday:{
        type:String,
        default:""
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