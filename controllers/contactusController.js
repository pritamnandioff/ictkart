const contactUs = require("../models/ContactUs");
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
    list: async (req, res) => {
        try {
            let contacts = await contactUs.find({});
            let total = await contactUs.countDocuments({});
            return SendResponse(res, { total, contacts: contacts }, 'Contact list');
        } catch (err) {
            console.log(err);
            return SendResponse(res, Boom.badImplementation('Opps something wents wrong'));
        }
    },
    reply: async (req, res) => {
        try {
            let query = await contactUs.findOne({ _id: req.body.queryId, status: true });
            if (query) {
                await contactUs.findOneAndUpdate({ _id: req.body.queryId }, {
                    $set: {
                        queryReply: req.body.reply,
                        replyDate: new Date()
                    }
                })
                await EmailService.Email(query.email,req.body.reply);
                return SendResponse(res, {}, 'reply has been sent to the mail');

            }
        } catch (err) {
            console.log(err);
            return SendResponse(res, Boom.badImplementation('Opps something wents wrong'));
        }
    }
}