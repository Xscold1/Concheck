const jwt = require("jsonwebtoken");

const generateToken = (data) => {
    let jwtSecretKey = 'SECRET';

    const expirationTime = '100h';
    // Sample Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTY2MDQ2Mjg2NX0.-UGJag-edjx1cyGcTBhCq_VG3OyGcsbI7CKJPVWoago
    const token = jwt.sign(data,jwtSecretKey,{
        expiresIn: expirationTime
    });

    return token;
}


module.exports = { generateToken };