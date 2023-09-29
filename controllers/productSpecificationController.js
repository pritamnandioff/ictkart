const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const ProductSpecification = require("../models/ProductSpecification");
const { generatePassword, generateProductId, generateOtp, capitalizeFirst } = require("../util/index");
const SendResponse = require("../services/apiHandler");
const Boom = require('@hapi/boom');

module.exports = {
    add: async (req, res) => {
        try {
            let ban = new ProductSpecification(req.body);
            ban = await ban.save();
            return SendResponse(res, ban, 'specification added.');
        } catch (err) {
            console.log(err);
            return SendResponse(res, Boom.badImplementation('Opps something wents wrong'));
        }
    },
}
