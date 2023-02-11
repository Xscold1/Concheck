const mongoose = require('mongoose')

const connectDb = async () => {
    try {
        mongoose.set('strictQuery', true)
        await mongoose.connect(process.env.DB_URI)
    }catch (err){
        console.log(err)
    }
}

module.exports = connectDb