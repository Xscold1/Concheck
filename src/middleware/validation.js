module.exports = function(req, res, next){
    
    try {
        const requestBody = req.body
        for(let fields in requestBody){
            if(typeof fields  != typeof requestBody[fields]){
                return res.send({
                    status:"FAILED",
                    statusCode:500,
                    response:{
                        message:`${fields} should be ${typeof fields}`
                    }
                })
                    
            }
        }
        next()
    } catch (error) {
        console.log('error', error)
        res.status(200).send({
          status: 'FAILED',
          status_code: error.statusCode || 500,
          message: error.message || 'Please contact administrator'}
        );
    }
}