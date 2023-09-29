const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const vendorServicesModel = require("../models/vendorServices");
const UserModel = require("../models/User");
const { generatePassword, generateProductId, generateOtp, capitalizeFirst } = require("../util/index");
const SendResponse = require("../services/apiHandler");
const Helper = require("../services/helper");
const FileService = require("../services/file-service");
const Boom = require('@hapi/boom');
module.exports = {
    add: async (req, res) => {
        try {
            let existService = await vendorServicesModel.findOne({ vendorId: req.body.vendorId, title: req.body.title });
            if (existService) {
                return SendResponse(res, Boom.notFound("Service title already exist"));
            }
            let newService = new vendorServicesModel(req.body);
            let data = await newService.save();
            return SendResponse(res, data, `Service added`);
        } catch (err) {
            console.log(err);
            return SendResponse(
                res,
                Boom.badImplementation("Oops something wents wrong")
            );
        }
    },
    update: async (req, res) => {
        try {
            let existService = await vendorServicesModel.findOne({ _id: req.body.serviceId,vendorId:req.body.vendorId });
            if (!existService) {
                return SendResponse(res, Boom.notFound("Service not found"));
            }
            else {
                let exists = await vendorServicesModel.findOneAndUpdate({ _id: req.body.serviceId,vendorId:req.body.vendorId }, req.body, { new: true });
                if (exists) {
                    return SendResponse(res, {}, "Service updated");
                }
            }
        } catch (err) {
            console.log(err);
            return SendResponse(
                res,
                Boom.badImplementation("Oops something wents wrong")
            );
        }
    },
    updateStatus: async (req, res) => {
        try {
            let existService = await vendorServicesModel.findOneAndUpdate({ _id: req.body.serviceId }, { $set: { status: req.body.status } }, { new: true })
            if (existService) {
                return SendResponse(res, { data: existService }, 'Record updated');
            } else {
                return SendResponse(res, {}, 'Record not found');
            }
        } catch (err) {
            console.log(err);
            return SendResponse(
                res,
                Boom.badImplementation("Oops something wents wrong")
            );
        }
    },
    list: async (req, res) => {
        try {
            let total = await vendorServicesModel.countDocuments({
                vendorId:ObjectId(req.query.vendorId)
            });
            let list = await vendorServicesModel.aggregate([
                {
                    $match:{
                        vendorId:ObjectId(req.query.vendorId)
                    }
                },
                {
                    $lookup: {
                        from: "services",
                        let: { services: "$serviceCategory" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $in: ["$_id", "$$services"],
                                    },
                                },
                            },
                            {
                                $lookup: {
                                    from: "categories",
                                    let: { categories: "$categories" },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    $in: ["$_id", "$$categories"],
                                                },
                                            },
                                        },
                                        {
                                            $project: {
                                                slug: 1
                                            }
                                        }
                                    ],
                                    as: "categories"
                                }
                            }
                            // {
                            //     $project: {
                            //         title: 1,
                            //         description: 1,
                            //         // categories: 1
                            //     }
                            // }
                        ],
                        as: "ServiceCategories"
                    }
                }
            ]);
            return SendResponse(res, { list: list, total: total }, 'service List');
        } catch (err) {
            console.log(err);
            return SendResponse(
                res,
                Boom.badImplementation("Oops something wents wrong")
            );
        }
    },
    details: async (req, res) => {
        try {
            let service = await vendorServicesModel.aggregate([
                {
                    $match: {
                        _id: ObjectId(req.query.serviceId)
                    }
                },
                {
                    $lookup: {
                        from: "categories",
                        let: { categories: "$categories" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $in: ["$_id", "$$categories"],
                                    },
                                },
                            },
                            {
                                $project: {
                                    slug: 1
                                }
                            }
                        ],
                        as: "categories"
                    }
                }
            ]);
            return SendResponse(res, { data: service }, 'service details');
        } catch (err) {
            console.log(err);
            return SendResponse(
                res,
                Boom.badImplementation("Oops something wents wrong")
            );
        }
    },
}