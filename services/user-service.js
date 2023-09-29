const jwt = require('jsonwebtoken');
const constant = require('../config/keys');
const nodemailer=require("nodemailer"); 
module.exports = {
    Auth: async (req) => {
        var token = (req.headers.authorization)
            || (req.body && req.body.access_token)
            || req.body.token
            || req.query.token
            || req.headers['x-access-token'];
        try {
            const decode = jwt.decode(token, constant.JWT_SECRET);
            return decode.data;
        }
        catch (err) {
            return

            
        }
    }
}