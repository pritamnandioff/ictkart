const Brand = require("../models/Brand");
const fs = require('fs');
const path = require('path');
const ObjectId = require('mongodb').ObjectId;
const SendResponse = require("../services/apiHandler");
const Boom = require('@hapi/boom');
const FileService = require('../services/file-service');
function createSlug(values) {
    values = values.trim();
    values = values.split(' ').join('-');
    return values.toLowerCase();
}
module.exports = {
    add: async (req, res) => {
        try {
            if (req.files) {
                req.body.image = await FileService.uploadImage(req.files.image);
            }
            req.body.slug = createSlug(req.body.title)
            let newUser = new Brand(req.body);
            let userData = await newUser.save();
            return SendResponse(res, userData, `Brand registered successfully `);
        } catch (error) {
            console.log(error);
            return SendResponse(
                res,
                Boom.badImplementation("Opps something wents wrong")
            );
        }
    },
    detail: async (req, res) => {
        try {
            let exist = await Brand.findOne({ _id: req.body.brandId });
            if (exist) {
                return SendResponse(res, exist, `Brand fetched successfully `);
            } else {
                return SendResponse(res, Boom.badRequest("no data found"));
            }
        }
        catch (error) {
            console.log(error);
            return SendResponse(
                res,
                Boom.badImplementation("Opps something wents wrong")
            );
        }
    },
    changeAccountStatus: async (req, res) => {
        try {
            let existUser = await Brand.findOne({ _id: req.body.brandId });
            if (existUser) {
                await Brand.findOneAndUpdate({ _id: req.body.brandId }, { $set: { status: req.body.status } }, { new: true })
                return SendResponse(res, {}, 'Record updated');
            } else {
                return SendResponse(res, {}, 'Record not found');
            }
        } catch (error) {
            console.log(error);
            return SendResponse(res, Boom.badImplementation(error));
        }
    },
    getList: async (req, res) => {
        try {
            let qury = {
                type: req.query.type || 'brand'
            }
            const list = await Brand.find(qury);
            const total = await Brand.countDocuments(qury);
            return SendResponse(res, { list: list, total: total }, 'list');
        } catch (err) {
            console.log(err);
        }
    },
    dropdownList: async (req, res) => {
        try {
            let qury = {
                type: req.query.type || 'brand'
            }
            const list = await Brand.aggregate([
                { $match: qury },
                {
                    $project: {
                        value: "$_id",
                        label: "$title",
                    }
                }
            ]);
            return SendResponse(res, list, 'list');
        } catch (err) {
            console.log(err);
            return SendResponse(res, Boom.badImplementation(err));
        }
    },
    update: async (req, res) => {
        try {
            let existUser = await Brand.findOne({ _id: req.body.brandId });
            if (existUser) {
                if (req.files) {
                    req.body.image = await FileService.uploadImage(req.files.image);
                }
                await Brand.findOneAndUpdate({ _id: req.body.brandId }, { $set: req.body }, { new: true })
                return SendResponse(res, {}, 'Record updated');
            } else {
                return SendResponse(res, {}, 'Record not found');
            }

        } catch (err) {
            console.log(err);
        }
    },
}