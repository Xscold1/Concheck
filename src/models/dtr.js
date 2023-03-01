const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
   
   crewId:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'crew'
   },

})

module.exports = Dtr = mongoose.model('dtr', dtrSchema);