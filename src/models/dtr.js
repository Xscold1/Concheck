const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AutoIncrement = require('mongoose-sequence')(mongoose);

const dtrSchema = new Schema({

   timeIn:{
      type: String,
   },

   timeOut:{
      type: String,
   },

   date:{
      type:String
   },

   dayToday: {
      type:String,
   },

   dailySalary:{
      type:Number
   },
   
   projectId: {
      type:Number,
      ref: 'project',
  },
  crewId:{
      type:Number,
  }

})
dtrSchema.plugin(AutoIncrement, {inc_field: 'dtrId'});

module.exports = Dtr = mongoose.model('dtr', dtrSchema);