const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const ReviewRatings = require("../models/ReviewRatings");
const { generatePassword, generateProductId, generateOtp, capitalizeFirst } = require("../util/index");
const SendResponse = require("../services/apiHandler");
const Boom = require('@hapi/boom');
require("dotenv").config()
module.exports = {
    add: async (req, res) => {
        try {
            let review = new ReviewRatings(req.body);
            review = await review.save();
            return SendResponse(res, review, 'ReviewRatings added.');
        } catch (err) {
            console.log(err);
            return SendResponse(res, Boom.badImplementation('Opps something wents wrong'));
        }
    },
    ratingandreviewlist: async (req, res) => {
        try {
            console.log(req.query)
            let { approvedStatus, status, ratingFor } = req.query
            let list = await ReviewRatings.aggregate([
                {
                    $match: {
                        ratingFor: ratingFor,
                        // approvedStatus: approvedStatus,
                        // status: Boolean(status)
                    }
                },
                {
                    $lookup: {
                        "from": "users",
                        "let": { vendorId: "$vendorId" },
                        "pipeline": [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ["$_id", "$$vendorId"]
                                    }
                                }
                            },
                            {
                                $project: {
                                    firstName: 1,
                                    lastName: 1,
                                    mobile: 1,
                                    avatar: { $concat: [IMG_URL, "$avatar"] },
                                }
                            }],
                        "as": "vendor"
                    }
                },
                {
                    $lookup: {
                        "from": "users",
                        "let": { userId: "$userId" },
                        "pipeline": [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ["$_id", "$$userId"]
                                    }
                                }
                            },
                            {
                                $project: {
                                    firstName: 1,
                                    lastName: 1,
                                    mobile: 1,
                                    avatar: { $concat: [IMG_URL, "$avatar"] },
                                }
                            }],
                        "as": "user"
                    }
                },
                {
                    $lookup: {
                        "from": "products",
                        "let": { productId: "$productId" },
                        "pipeline": [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ["$_id", "$$productId"]
                                    }
                                }
                            },
                            {
                                $project: {
                                    "title": 1,
                                    "description": 1,
                                    "uniqueId": 1,
                                    "categories": 1,
                                    "sellingPrice": 1,
                                    "originalPrice": 1,
                                    "ratings": 1,
                                    "totalUnits": 1,
                                    thumbnail: { $concat: [IMG_URL, "$thumbnail"] },
                                    "soldUnits": 1,
                                    images: {
                                        $map: {
                                            input: "$images",
                                            as: "images",
                                            in: { $concat: [IMG_URL, "$$images"] },
                                        },
                                    },
                                }
                            }],
                        "as": "product"
                    }
                },
                {
                    $project: {
                        status: 1,
                        // vendor:1,
                        // user:1,
                        // product:1,
                        approvedStatus: 1,
                        vendor: { $cond: { if: { $gte: ["$vendor.length", 0] }, then: { $arrayElemAt: ["$vendor", 0] }, else: "$vendor" } },
                        user: { $cond: { if: { $gte: ["$user.length", 0] }, then: { $arrayElemAt: ["$user", 0] }, else: "$user" } },
                        product: { $cond: { if: { $gte: ["$product.length", 0] }, then: { $arrayElemAt: ["$product", 0] }, else: "$product" } },
                        likes: { $size: "$likes" },
                        rateDate: "$createdAt",
                        comments: 1,
                        rate: 1,
                    }
                }
            ])
            return SendResponse(res, { list: list }, 'ReviewRatings list.');

        } catch (err) {
            console.log(err);
            return SendResponse(
                res,
                Boom.badImplementation("Oops something wents wrong")
            );
        }
    },
    approveReviewed: async (req, res) => {
        try {
            let exist = await ReviewRatings.findOne({ _id: req.body.reviewId })
            if (exist) {
                await ReviewRatings.findOneAndUpdate({ _id: req.body.reviewId }, {
                    $set: {
                        approvedStatus: req.body.approvedStatus
                    }
                }, { new: true })
                return SendResponse(res, {}, `review  ${req.body.approvedStatus}.`);
            }
        } catch (err) {
            console.log(err);
            return SendResponse(res, Boom.badImplementation('Opps something wents wrong'));
        }
    },
    reviewDetail: async (req, res) => {
        try {
            let detail = await ReviewRatings.aggregate([
                {
                    $match: {
                        _id: ObjectId(req.body.reviewId)
                    }
                },
                {
                    $lookup: {
                        "from": "users",
                        "let": { vendorId: "$vendorId" },
                        "pipeline": [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ["$_id", "$$vendorId"]
                                    }
                                }
                            },
                            {
                                $project: {
                                    firstName: 1,
                                    lastName: 1,
                                    mobile: 1,
                                    avatar: { $concat: [IMG_URL, "$avatar"] },
                                }
                            }],
                        "as": "vendor"
                    }
                },
                {
                    $lookup: {
                        "from": "users",
                        "let": { userId: "$userId" },
                        "pipeline": [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ["$_id", "$$userId"]
                                    }
                                }
                            },
                            {
                                $project: {
                                    firstName: 1,
                                    lastName: 1,
                                    mobile: 1,
                                    avatar: { $concat: [IMG_URL, "$avatar"] },
                                }
                            }],
                        "as": "user"
                    }
                },
                {
                    $lookup: {
                        "from": "products",
                        "let": { productId: "$productId" },
                        "pipeline": [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ["$_id", "$$productId"]
                                    }
                                }
                            },
                            {
                                $project: {
                                    "title": 1,
                                    "description": 1,
                                    "uniqueId": 1,
                                    "categories": 1,
                                    "sellingPrice": 1,
                                    "originalPrice": 1,
                                    "ratings": 1,
                                    "totalUnits": 1,
                                    thumbnail: { $concat: [IMG_URL, "$thumbnail"] },
                                    "soldUnits": 1,
                                    images: {
                                        $map: {
                                            input: "$images",
                                            as: "images",
                                            in: { $concat: [IMG_URL, "$$images"] },
                                        },
                                    },
                                }
                            }],
                        "as": "product"
                    }
                },
                {
                    $project: {
                        vendor: { $cond: { if: { $gte: ["$vendor.length", 0] }, then: { $arrayElemAt: ["$vendor", 0] }, else: "$vendor" } },
                        user: { $cond: { if: { $gte: ["$user.length", 0] }, then: { $arrayElemAt: ["$user", 0] }, else: "$user" } },
                        product: { $cond: { if: { $gte: ["$product.length", 0] }, then: { $arrayElemAt: ["$product", 0] }, else: "$product" } },
                        likes: { $size: "$likes" },
                        rateDate: "$createdAt",
                        comments: 1,
                        rate: 1,
                    }
                }
            ])
            return SendResponse(res, { data: detail }, 'ReviewRatings detail.');

        } catch (err) {
            console.log(err);
            return SendResponse(res, Boom.badImplementation('Opps something wents wrong'));
        }
    },
    reviewsByProduct: async (req, res) => {
        try {
            let { vendorId = "" } = req.body;
            let query = { productId: req.body.productId, ratingFor: 'product' };
            if (vendorId != "") {
                query = { vendorId: req.body.vendorId, ratingFor: 'vendor' };
            }

            let review = await ReviewRatings.find(query)
                .populate('userId', "email firstName lastName dialCode mobile avatar");
            let total = await ReviewRatings.countDocuments(query);
            return SendResponse(res, { total: total, ratings: review }, 'Reviews list');
        } catch (err) {
            console.log(err);
            return SendResponse(res, Boom.badImplementation('Opps something wents wrong'));
        }
    }
}
