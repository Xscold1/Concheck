
//utils
const mongoose = require('mongoose');
const conn = mongoose.connection;
const status = require('../../constants/statusCode');

//models
const Project = require('../../models/project');

const CREATE_PROJECT = async () => {
    try {
        const {image , projectName, startDate, endDate, projectEngineer, siteEngineer, safetyOfficer, projectCode, status, budget} = req.body;
        const checkProjecifExist = await Project.findOne({projectName: projectName});
        console.log(status.success)
        if(!checkProjecifExist){
            return res.send({
                status: status.success
            })
        }
    } catch (error) {
        return res.send({
            status: status.error
        })
    }
}

module.exports = {
    CREATE_PROJECT
}