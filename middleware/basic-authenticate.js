const SendResponse = require("../services/apiHandler");
const KEYS = require("../config/keys");
module.exports = async (req, res, next) => {
    try {
        // var auth = new Buffer.from(req.headers.authorization.split(' ')[1], 'base64').toString('ascii').split(':');
        // var user = auth[0];
        // var pass = auth[1];
        // if (user == KEYS.BASIC_USER && pass == KEYS.BASIC_PASSWORD) {
            next();
        // }
        // else {
        //     return SendResponse(res, { isBoom: true, statusCode: 401 }, 'You are not authorized to access this application')
        // }
    }
    catch (err) {
        console.log(err);
        return SendResponse(res, { isBoom: true, statusCode: 401 }, 'You are not authorized to access this application')
    }
}