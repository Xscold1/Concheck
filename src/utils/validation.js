

const Validate = (requestBody, Schema) => {
    for(let field in requestBody){
        let validation = Schema.schema.paths[field].instance;
        
        if (validation.toUpperCase() !== (typeof requestBody[field]).toUpperCase()) {
            throw {message:`${field} shoud be ${validation}`}
        }
    }
    throw {message:`Success`}
}

module.exports = Validate