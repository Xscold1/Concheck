module.exports = function(req, res, next){

    try {
        const requestBody = req.body
        for(let fields in requestBody){
            if(typeof fields  != typeof requestBody[fields])
            throw { statusCode: 500, message: `${fields} should be ${typeof fields}` };
        }
        next()
    } catch (error) {
        console.log(error)
        res.status(200).send({
          status: 'FAILED',
          status_code: error.statusCode || 500,
          message: error.message || 'Please contact administrator'}
        );
    }
}