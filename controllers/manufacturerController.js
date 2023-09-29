const Manufacturer = require("../models/Manufacturer");
const path = require('path');
const ObjectId = require('mongodb').ObjectId;
const SendResponse = require("../services/apiHandler");
const Boom = require('@hapi/boom');
const FileService = require('../services/file-service');

module.exports = {
    add: async (req, res) => {
        try {
            if (req.files) {
                req.body.image = await FileService.uploadImage(req.files.image);
            }
            let newUser = new Manufacturer(req.body);
            let userData = await newUser.save();
            return SendResponse(res, userData, `Manufacturer registered successfully `);
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
            let exist = await Manufacturer.findOne({ _id: req.body.ManufacturerId });
            if (exist) {
                return SendResponse(res, exist, `Manufacturer fetched successfully `);
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
            let existUser = await Manufacturer.findOne({ _id: req.body.ManufacturerId });
            if (existUser) {
                await Manufacturer.findOneAndUpdate({ _id: req.body.ManufacturerId }, { $set: { status: req.body.status } }, { new: true })
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
            const list = await Manufacturer.find({});
            const total = await Manufacturer.countDocuments({});
            return SendResponse(res, { list: list, total: total }, 'list');
        } catch (err) {
            console.log(err);
        }
    },
    dropdownList: async (req, res) => {
        try {
            const list = await Manufacturer.aggregate([
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
            let existUser = await Manufacturer.findOne({ _id: req.body.ManufacturerId });
            if (existUser) {
                if (req.files) {
                    req.body.image = await FileService.uploadImage(req.files.image);
                }
                await Manufacturer.findOneAndUpdate({ _id: req.body.ManufacturerId }, { $set: req.body }, { new: true })
                return SendResponse(res, {}, 'Record updated');
            } else {
                return SendResponse(res, {}, 'Record not found');
            }

        } catch (err) {
            console.log(err);
        }
    },
}