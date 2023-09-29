const Blogs = require("../models/Blogs");
const fs = require('fs');
const path = require('path');
const ObjectId = require('mongodb').ObjectId;
const SendResponse = require('../services/apiHandler');
const Boom = require('@hapi/boom');
const { createSlug } = require('../services/helper');
const FileService = require('../services/file-service');
const EmailService = require("../services/email-service");

module.exports = {
    add: async (req, res) => {
        try {
            let ban = new contactUs(req.body);
            ban = await ban.save();
            return SendResponse(res, ban, 'admin will contact you shortly.');
        } catch (err) {
            console.log(err);
            return SendResponse(res, Boom.badImplementation('Opps something wents wrong'));
        }
    },
}