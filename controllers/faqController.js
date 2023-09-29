const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const faqModel = require("../models/Faqs");
const SendResponse = require("../services/apiHandler");
const Boom = require('@hapi/boom');

module.exports = {
    add: async (req, res) => {
        try {
            let newFaq = new faqModel(req.body);
            let faq = await newFaq.save();
            return SendResponse(res, faq, `faq added`);
        } catch (err) {
            console.log(err);
            return SendResponse(
                res,
                Boom.badImplementation("Opps something wents wrong")
            );
        }
    },
    update: async (req, res) => {
        try {
            let existUser = await faqModel.findOne({ _id: req.body.faqId });
            if (!existUser) {
                return SendResponse(res, Boom.notFound("Faqs not found"));
            }
            else {
                let exists = await faqModel.findOneAndUpdate({ _id: req.body.faqId }, req.body, { new: true });
                if (exists) {
                    return SendResponse(res, {}, "faq updated");
                }
            }
        } catch (err) {
            console.log(err);
            return SendResponse(
                res,
                Boom.badImplementation("Opps something wents wrong")
            );
        }
    },
    updateStatus: async (req, res) => {
        try {
            let existFaq = await faqModel.findOneAndUpdate({ _id: req.body.faqId }, { $set: { status: req.body.status } }, { new: true })
            if (existFaq) {
                return SendResponse(res, existFaq, 'Record updated');
            } else {
                return SendResponse(res, {}, 'Record not found');
            }
        } catch (err) {
            console.log(err);
            return SendResponse(
                res,
                Boom.badImplementation("Opps something wents wrong")
            );
        }
    },
    list: async (req, res) => {
        try {
            let faqList = await faqModel.find();
            let totalFaqs = await faqModel.countDocuments();
            return SendResponse(res, { faqs: faqList, total: totalFaqs }, 'Faq List');
        } catch (err) {
            console.log(err);
            return SendResponse(
                res,
                Boom.badImplementation("Opps something wents wrong")
            );
        }
    },
    details: async (req, res) => {
        try {
            let faq = await faqModel.findOne({ _id: req.query.faqsId }, { question: 1, answer: 1 });
            return SendResponse(res, faq, 'Faq List');
        } catch (err) {
            console.log(err);
            return SendResponse(
                res,
                Boom.badImplementation("Opps something wents wrong")
            );
        }
    }
}