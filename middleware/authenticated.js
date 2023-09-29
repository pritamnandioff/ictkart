const JWT = require('jsonwebtoken')
const { JWT_SECRET } = require('../config/keys');
const Boom = require('../util/responce-codes');
const SendResponse = require('../services/apiHandler');
module.exports = (req, res, next) => {
    try {
        var token = req.headers['x-access-token'];
        if (token) {
            token = token.split(" ");
            let Bearer = token.length ? token[0] : token;
            let Token = token.length ? token[1] : token;
            const decode = JWT.verify(Token, JWT_SECRET);
            /**
             * Check the valid token
             */
            if (Bearer == 'Bearer' && decode) {
                req.loginUSER = decode.data;
                next();
            }
            else {
                return SendResponse(res, Boom.unauthorized('Your token expired. Please login again and continue...'));
            }
        }
        else {
            return SendResponse(res, Boom.unauthorized('Your token expired. Please login again and continue...'));
        }
    }
    catch (err) {
        // console.log(err);
        return SendResponse(res, Boom.unauthorized('Your token expired. Please login again and continue...'))
    }
}