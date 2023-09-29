const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const serviceModel = require("../models/Services");
const CategoriesModel = require("../models/Categories");
const UserModel = require("../models/User");
const { generatePassword, generateProductId, generateOtp, capitalizeFirst } = require("../util/index");
const SendResponse = require("../services/apiHandler");
const Helper = require("../services/helper");
const FileService = require("../services/file-service");
const Boom = require('@hapi/boom');
const UserService = require("../services/user-service");
const WishListModel = require("../models/WishList");

module.exports = {
    add: async (req, res) => {
        try {
            let existService = await serviceModel.findOne({ title: capitalizeFirst(req.body.title) });
            // console.log(existService);
            // if (existService) {
            //     return SendResponse(res, Boom.notFound("Service title already exist"));
            // }
            let newService = new serviceModel(req.body);
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
            let existService = await serviceModel.findOne({ _id: req.body.serviceId });
            if (!existService) {
                return SendResponse(res, Boom.notFound("Service not found"));
            }
            else {
                if (req.files) {
                    if (req.files.images !== undefined && req.files.images) {
                        req.body.images = await FileService.uploadImage(req.files.images, true);
                    }
                }
                let exists = await serviceModel.findOneAndUpdate({ _id: req.body.serviceId }, req.body, { new: true });
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
            let existService = await serviceModel.findOneAndUpdate({ _id: req.body.serviceId }, { $set: { status: req.body.status } }, { new: true })
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
            let total = await serviceModel.countDocuments();
            let list = await serviceModel.find().populate('category', "title")
                .populate("subcategory", "title");
            return SendResponse(res, { list: list, total: total }, 'service List');
        } catch (err) {
            console.log(err);
            return SendResponse(
                res,
                Boom.badImplementation("Oops something wents wrong")
            );
        }
    },
    edit: async (req, res) => {
        try {
            let existService = await serviceModel.findOne({ _id: req.body.serviceId });
            if (existService) {
                existService = JSON.parse(JSON.stringify(existService));
                existService.images = existService.images && existService.images.map((im) => IMG_URL + im)
                let subcategory = await CategoriesModel.find({ parentId: existService.category }, { title: 1 });
                existService.subcategories = subcategory.map((obj) => { return { label: obj.title, value: obj._id } })
            }
            else {
                existService.subcategories = [];
            }
            return SendResponse(res, existService, 'Edit service');
        } catch (err) {
            console.log(err);
            return SendResponse(
                res,
                Boom.badImplementation("Oops something wents wrong")
            );
        }
    },
    servicelist: async (req, res) => {
        try {
            let userData = await UserService.Auth(req);
            req.body.userId = userData ? userData.id : req.body.userId;
            let { type = '', price = "", category = "", service = null } = req.body;
            let query = { status: true }
            if (price != "") {
                let mrp = price.split("-");
                query.sellingPrice = { $gte: Number(mrp[0]), $lt: Number(mrp[1]) }
            }
            if (category != "") {
                query.categories = { $in: [ObjectId(category)] }
            }
            let products = [];
            let favourites = await WishListModel.findOne({ type: type, userId: req.body.userId }, { serviceId: 1 });
            if (favourites) {
                favourites = JSON.parse(JSON.stringify(favourites));
                products = favourites.serviceId.map(pro => ObjectId(pro));
            }
            if (['view', 'wishlist'].includes(type)) {
                products = products.filter((obj) => obj._id.toString() != service)
                query._id = { $in: products }
            }
            if (['other'].includes(type)) {
                query.vender = ObjectId(req.body.userId);
                query._id = { $nin: [ObjectId(req.body.productId)] }
            }
            let total = await serviceModel.countDocuments(query);
            let list = await serviceModel.aggregate([
                { $match: query },
                {
                    $lookup: {
                        from: 'categories',
                        localField:"category",
                        foreignField:"_id",
                        as: 'category'
                    }
                },
                {
                    $lookup: {
                        from: 'categories',
                        localField:"subcategory",
                        foreignField:"_id",
                        as: 'subcategory'
                    }
                },
                {
                    $lookup: {
                        "from": "reviewratings",
                        "let": { id: "$_id" },
                        "pipeline": [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ["$productId", "$$id"]
                                    },
                                    ratingFor: 'service',
                                    isApproved: true,
                                    status: true
                                }
                            },
                            {
                                $project: {
                                    rate: 1,
                                }
                            }
                        ],
                        "as": "ratings"
                    }
                },
                {
                    $lookup: {
                        "from": "users",
                        "let": { venderID: "$vender" },
                        "pipeline": [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ["$_id", "$$venderID"]
                                    }
                                }
                            },
                            { $limit: 1 },
                            {
                                $project: {
                                    firstName: 1,
                                    lastName: 1,
                                    "avatar": {
                                        $cond: {
                                            if: { $eq: ["$avatar", ""] },
                                            then: "",
                                            else: { $concat: [IMG_URL, "$avatar"] },
                                        }
                                    },
                                }
                            }
                        ],
                        as: "vendor"
                    }
                },
                {
                    $project: {
                        averageRating: {
                            $cond: {
                                if: { $isArray: "$ratings" },
                                then: { $avg: "$ratings.rate" },
                                else: 0,
                            },
                        },
                        title: 1,
                        basic: 1,
                        images: {
                            $map: {
                                input: "$images",
                                as: "images",
                                in: { $concat: [IMG_URL, "$$images"] },
                            },
                        },
                        thumbnail: {
                            $cond: [
                                { $gte: [{ $size: "$images" }, 1] },
                                { $concat: [IMG_URL, { $arrayElemAt: ["$images", 0] }] },
                                PRODUCT_URL
                            ]
                        },
                        category:"$category",
                        subcategory:"$subcategory",
                        vendor: { $cond: [{ $gte: [{ $size: "$vendor" }, 1] }, { $arrayElemAt: ["$vendor", 0] }, {}] }
                    }
                }
            ]);
            return SendResponse(res, { total, list: list }, 'list');

        } catch (err) {
            console.log(err);
            return SendResponse(
                res,
                Boom.badImplementation("Oops something wents wrong")
            );
        }
    },
    serviceListAdmin: async (req, res) => {
        try {
            let total = await serviceModel.countDocuments();
            let list = await serviceModel.aggregate([
                {
                    $lookup: {
                        "from": "users",
                        "let": { venderID: "$vender" },
                        "pipeline": [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ["$_id", "$$venderID"]
                                    }
                                }
                            },
                            { $limit: 1 },
                            {
                                $project: {
                                    firstName: 1,
                                    lastName: 1,
                                    mobile: 1,
                                }
                            }
                        ],
                        as: "vendor"
                    }
                },
                {
                    $lookup: {
                        from: "categories",
                        let: { category: "$category" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ["$_id", "$$category"],
                                    },
                                },
                            },
                            { $limit: 1 },
                            {
                                $project: {
                                    title: 1
                                }
                            }
                        ],
                        as: "category"
                    }
                },
                {
                    $lookup: {
                        from: "categories",
                        let: { subcategory: "$subcategory" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ["$_id", "$$subcategory"],
                                    },
                                },
                            },
                            { $limit: 1 },
                            {
                                $project: {
                                    title: 1
                                }
                            }
                        ],
                        as: "subcategory"
                    }
                },
                {
                    $project: {
                        title: 1,
                        basic: 1,
                        description: 1,
                        conditions: 1,
                        images: {
                            $map: {
                                input: "$images",
                                as: "images",
                                in: { $concat: [IMG_URL, "$$images"] },
                            },
                        },
                        thumbnail: {
                            $cond: [
                                { $gte: [{ $size: "$images" }, 1] },
                                { $concat: [IMG_URL, { $arrayElemAt: ["$images", 0] }] },
                                PRODUCT_URL
                            ]
                        },
                        category: {
                            $cond: [
                                { $gte: [{ $size: "$category" }, 1] },
                                { $arrayElemAt: ["$category", 0] },
                                { title: "" }
                            ]
                        },
                        subcategory: {
                            $cond: [
                                { $gte: [{ $size: "$subcategory" }, 1] },
                                { $arrayElemAt: ["$subcategory", 0] },
                                { title: "" }
                            ]
                        },
                        status: 1,
                        vendor: { $cond: [{ $gte: [{ $size: "$vendor" }, 1] }, { $arrayElemAt: ["$vendor", 0] }, {}] }
                    }
                },
            ])
            return SendResponse(res, { list: list, total: total }, 'product List');

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
            let detail = await serviceModel.aggregate([
                {
                    $match: {
                        _id: ObjectId(req.body.serviceId)
                    }
                },
                {
                    $lookup: {
                        from: "categories",
                        let: { category: "$category" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ["$_id", "$$category"],
                                    },
                                },
                            },
                            { $limit: 1 },
                            {
                                $project: {
                                    title: 1
                                }
                            }
                        ],
                        as: "category"
                    }
                },
                {
                    $lookup: {
                        from: "categories",
                        let: { subcategory: "$subcategory" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ["$_id", "$$subcategory"],
                                    },
                                },
                            },
                            { $limit: 1 },
                            {
                                $project: {
                                    title: 1
                                }
                            }
                        ],
                        as: "subcategory"
                    }
                },
                {
                    $lookup: {
                        "from": "reviewratings",
                        "let": { reviewId: "$_id" },
                        "pipeline": [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ["$productId", "$$reviewId"]
                                    },
                                    ratingFor: 'service',
                                    isApproved: true,
                                    status: true
                                }
                            },
                            {
                                $project: {
                                    rate: 1,
                                }
                            }
                        ],
                        "as": "ratings"
                    }
                },
                {
                    $project: {
                        totalRating: {
                            $cond: {
                                if: { $isArray: "$ratings" },
                                then: { $size: "$ratings" },
                                else: 0,
                            },
                        },
                        averageRating: {
                            $cond: {
                                if: { $isArray: "$ratings" },
                                then: { $avg: "$ratings.rate" },
                                else: 0,
                            },
                        },
                        title: 1,
                        basic: 1,
                        description: 1,
                        conditions: 1,
                        images: {
                            $map: {
                                input: "$images",
                                as: "images",
                                in: { $concat: [IMG_URL, "$$images"] },
                            },
                        },
                        thumbnail: {
                            $cond: [
                                { $gte: [{ $size: "$images" }, 1] },
                                { $concat: [IMG_URL, { $arrayElemAt: ["$images", 0] }] },
                                PRODUCT_URL
                            ]
                        },
                        category: {
                            $cond: [
                                { $gte: [{ $size: "$category" }, 1] },
                                { $arrayElemAt: ["$category", 0] },
                                { title: "" }
                            ]
                        },
                        subcategory: {
                            $cond: [
                                { $gte: [{ $size: "$subcategory" }, 1] },
                                { $arrayElemAt: ["$subcategory", 0] },
                                { title: "" }
                            ]
                        },
                        vender: 1
                    }
                }
            ]);
            let user = await Helper.userProfile(detail[0]['vender']);
            user['shop'] = await Helper.userCompanyInfo(detail[0]['vender']);
            let wishList = await Helper.wishListORview(req.body.userId, req.body.serviceId, 'service');
            let details = { ...detail[0], ...wishList };
            return SendResponse(res, { user, service: details }, 'list');
        } catch (err) {
            console.log(err);
            return SendResponse(
                res,
                Boom.badImplementation("Oops something wents wrong")
            );
        }
    },
    cartList: async (req, res) => {
        try {
            let userCarts = [];
            // if (req.body.serviceId && req.body.serviceId != "bycart") {
            let product = await serviceModel.findOne({ _id: req.body.serviceId }).populate('vender', "firstName lastName");
            let obj = {
                quantity: 1,
                title: product.title,
                originalPrice: product.basic && product.basic.originalPrice,
                sellingPrice: product.basic && product.basic.sellingPrice,
                currency: product.basic && product.basic.currency,
                _id: product._id,
                thumbnail: product.images && product.images.length ? IMG_URL + product.images[0] : PRODUCT_URL,
                seller: product.vender,
            }
            userCarts.push(obj);
            // }
            // else {
            //     let cart = await UserModel.findOne({ _id: req.body.userId }, {
            //         carts: 1
            //     }).populate({
            //         path: "carts.product",
            //         select: "title originalPrice sellingPrice currency thumbnail images",
            //         populate: {
            //             path: "vender",
            //             select: "firstName lastName"
            //         }
            //     });

            //     cart.carts.map((cartObj) => {
            //         let product = cartObj.product || {};
            //         let obj = {
            //             quantity: cartObj.units,
            //             title: product.title,
            //             originalPrice: product.originalPrice,
            //             sellingPrice: product.sellingPrice,
            //             currency: product.currency,
            //             _id: product._id,
            //             thumbnail: product.images && product.images.length ? IMG_URL + product.images[0] : PRODUCT_URL,
            //             seller: product.vender,
            //         }
            //         userCarts.push(obj);
            //         return cartObj;
            //     })
            // }
            return SendResponse(res, { list: userCarts }, "cart list")
        } catch (error) {
            console.log(error);
            return SendResponse(res, Boom.badImplementation(error))
        }
    },
    updateImages: async (req, res) => {
        try {
            let existproduct = await serviceModel.findOne({ _id: req.body.serviceId });
            if (!existproduct) {
                return SendResponse(res, Boom.notFound("Service not found"));
            }
            else {
                if (req.files) {
                    if (req.files.images !== undefined && req.files.images) {
                        let images = await FileService.uploadImage(req.files.images, true);
                        await serviceModel.findOneAndUpdate({ _id: req.body.serviceId }, {
                            $push: { images: images }
                        }, { new: true });
                    }
                }
                return SendResponse(res, {}, "Service updated");
            }
        } catch (err) {
            console.log(err);
            return SendResponse(
                res,
                Boom.badImplementation("Oops something wents wrong")
            );
        }
    },
}