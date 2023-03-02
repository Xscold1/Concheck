const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AutoIncrement = require('mongoose-sequence')(mongoose);

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

    projectId: {
        type:Number,
        ref: 'project',
    },
    crewId:{
        type:Number,
        ref: 'crew',
    }

})
csvSchema.plugin(AutoIncrement, {inc_field: 'csvId'});
module.exports = Csv = mongoose.model('csv', csvSchema);