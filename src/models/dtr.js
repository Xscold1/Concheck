const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AutoIncrement = require('mongoose-sequence')(mongoose);

const dtrSchema = new Schema({

   timeIn:{
      type: String,
   },

   timeOut:{
      tpye:String,
   },

   date:{
      type:String
   },

   dayToday: {
      type:String,
   },
   
   projectId: {
      type:Number,
      ref: 'project',
  },
  companyId:{
      type:Number,
      ref: 'company',
  },
  engineerId:{
      type:Number,
      ref: 'engineer',
  },
  crewId:{
      type:Number,
      ref: 'crew',
  }

})
dtrSchema.plugin(AutoIncrement, {inc_field: 'dtrId'});

module.exports = Dtr = mongoose.model('dtr', dtrSchema);