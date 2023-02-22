const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const dtrSchema = new Schema({
   timeIn:{
    type: Date,
   },
   timeOut:{
    tpye:Date,
   },
   crewId:{
    type: mongoose.Schema.Types.ObjectId,
    ref:('crews')
   }

})

module.exports = Dtr = mongoose.model('dtr', dtrSchema);