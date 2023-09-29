const Content = require("../models/Content");
const ObjectId = require('mongodb').ObjectId;
const SendResponse = require('../services/apiHandler');
const Boom = require('@hapi/boom');
const { createSlug } = require('../services/helper');
const FileService = require('../services/file-service');
exports.getList = async (req, res) => {
    try {
        const contents = await Content.find({});
        let total = await Content.countDocuments();
        return SendResponse(res, { list: contents, total }, 'Business type list');
    }
    catch (err) {
        console.log(err);
        return SendResponse(res, Boom.badImplementation('Opps something wents wrong'));
    }
}
exports.create = async (req, res) => {
    try {
        let contnt = await Content.findOne({ type: req.body.type }, { type: 1 });
        if (contnt) {
            contnt = JSON.parse(JSON.stringify(contnt));
            req.body.contentId = contnt._id;
            this.update(req, res);
        }
        else {
            if (req.files) {
                req.body.image = await FileService.uploadImage(req.files.image);
            }
            let ban = new Content(req.body);
            ban = await ban.save();
            return SendResponse(res, ban, 'Content is added successfully');
        }
    } catch (err) {
        console.log(err);
        return SendResponse(res, Boom.badImplementation('Opps something wents wrong'));
    }
}
exports.update = async (req, res) => {
    try {
        let ban = await Content.findOne({ _id: req.body.contentId });
        if (ban) {
            if (req.files) {
                req.body.image = await FileService.uploadImage(req.files.image);
            }
            ban = await Content.findOneAndUpdate({ _id: req.body.contentId }, { $set: req.body }, { new: true });
            return SendResponse(res, ban, 'Content is added successfully');
        }
        else {
            return SendResponse(res, Boom.notFound('Not found'));
        }
    } catch (err) {
        console.log(err);
        return SendResponse(res, Boom.badImplementation('Opps something wents wrong'));
    }
}
exports.detail = async (req, res) => {
    try {
        let queryObj = {
            ...(req.body.contentId && { _id: req.body.contentId }),
            ...(req.body.type && { type: req.body.type })
        }
        let ban = await Content.findOne(queryObj);
        return SendResponse(res, ban, 'Content details');
    } catch (err) {
        console.log(err);
        return SendResponse(res, Boom.badImplementation('Opps something wents wrong'));
    }
}