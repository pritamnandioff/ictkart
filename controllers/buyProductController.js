const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const BuyProductModel = require("../models/BuyProduct");
const ProductModel = require("../models/Product");
const BuyProductOrdersModel = require("../models/BuyProductOrders");
const productOrderHistoryModel = require("../models/productOrderHistory");
const UserModel = require("../models/User");
const Boom = require('@hapi/boom');
const SendResponse = require("../services/apiHandler");
const EmailService = require("../services/email-service");

module.exports = {
    add: async (req, res) => {
        try {
            let { product: productData, token } = req.body;
            productData.invoiceNumber = Date.now();
            let cat = new BuyProductModel(productData);
            let product = await cat.save();
            if (product) {
                let productOrders = productData.items.map(item => {
                    item.buyproducts = product._id;
                    item.user = productData.user;
                    item.productInvoice = Date.now();
                    return item;
                })
                // let prodHistory = {  orderStatus: "ordered",
                //             reason: "your order is in processing",
                //             status: true,
                //             buyProductOrderId:product._id
                //         }
                // let his = await new productOrderHistoryModel(prodHistory);
                // his = await his.save();
                let his = await BuyProductOrdersModel.insertMany(productOrders);
                const allHis = his.map(value => ({
                    reason: "your order is in processing",
                    status: true,
                    userId: value.user,
                    buyProductOrderId: value._id
                }))
                await productOrderHistoryModel.insertMany(allHis);
                if (productData.type == 'product') {
                    for (let i = 0; i < allHis.length; i++) {
                        if (allHis === undefined) {
                            break;
                        }
                        await sendOrderNotification(allHis[i].buyProductOrderId);
                    }
                }
                if (productData.from == 'bycart') {
                    await UserModel.findOneAndUpdate({ _id: productData.user }, { $set: { carts: [] } });
                }
                return SendResponse(res, product, 'product purchased successfully');
            }
            else {
                return SendResponse(res, Boom.badRequest('product purchased successfully'));
            }
        } catch (error) {
            console.log(error);
            return SendResponse(res, Boom.badImplementation("Opps something wents wrong"));
        }
    },
    list: async (req, res) => {
        try {
            let query = {
                ...(req.body.orderStatus && { orderStatus: req.body.orderStatus }),
                ...(req.body.user && { user: req.body.user }),
                ...(req.body.vendor && { vendor: req.body.vendor }),
                ...(req.body.type && { type: req.body.type }),
            }
            let cat = await BuyProductOrdersModel.find(query)
                .populate({
                    path: "product",
                    select: "title originalPrice sellingPrice currency thumbnail modelNumber",
                    populate: {
                        path: "vender",
                        select: "firstName lastName"
                    }
                })
                .populate({
                    path: "service",
                    select: "title originalPrice sellingPrice currency thumbnail modelNumber",
                    populate: {
                        path: "vender",
                        select: "firstName lastName"
                    }
                })
                .populate('buyproducts')
                .populate("user", "firstName lastName mobile email")
                .populate("vendor", "firstName lastName mobile email")
                .sort({ createdAt: -1 });
            if (cat) {
                cat = JSON.parse(JSON.stringify(cat));
                cat = cat.map((obj) => {
                    if (obj.type == 'service') { obj.product = obj.service; delete obj.service; }
                    return obj;
                })
            }
            return SendResponse(res, { list: cat }, 'list');
        } catch (error) {
            console.log(error);
            return SendResponse(res, Boom.badImplementation("Opps something wents wrong"));
        }
    },
    adminOrderList: async (req, res) => {
        try {
            let { page, limit, sort, order, search, status } = req.body;
            let skip = page * limit - limit || 0;
            limit = parseInt(limit) || 10;

            order = order == "desc" ? -1 : 1;
            sort = {
                [sort || 'createdAt']: order
            };
            let query = {
                ...(req.body.type && { type: req.body.type }),
            }
            let total = await BuyProductOrdersModel.countDocuments(query);
            let cat = await BuyProductOrdersModel.find(query)
                .populate({
                    path: "product",
                    select: "title originalPrice sellingPrice currency thumbnail",
                    populate: {
                        path: "vender",
                        select: "firstName lastName"
                    }
                })
                .populate('buyproducts')
                .populate("user", "firstName lastName").sort(sort)
                .skip(skip)
                .limit(limit)
            return SendResponse(res, { total, list: cat }, 'list');
        } catch (error) {
            console.log(error);
            return SendResponse(res, Boom.badImplementation("Opps something wents wrong"));
        }
    },
    changeStatus: async (req, res) => {
        try {
            let cat = await BuyProductOrdersModel.findOneAndUpdate({ _id: req.body.buyProduct }, { $set: { orderStatus: req.body.orderStatus, reason: req.body.reason } });
            return SendResponse(res, {}, 'Status changed');
        } catch (error) {
            console.log(error);
            return SendResponse(res, Boom.badImplementation("Opps something wents wrong"));
        }
    },
    changeStatus1: async (req, res) => {
        try {
            let cat = await productOrderHistoryModel.findOne({ buyProductOrderId: req.body.orderId, orderStatus: req.body.orderStatus });
            if (!cat) {
                let prodHistory = {
                    orderStatus: req.body.orderStatus,
                    reason: req.body.reason,
                    status: req.body.status,
                    userId: req.body.userId,
                    buyProductOrderId: req.body.orderId
                }
                let his = await new productOrderHistoryModel(prodHistory);
                his = await his.save();

                let inv = await BuyProductOrdersModel.aggregate([
                    {
                        $match: {
                            _id: ObjectId(req.body.orderId)
                        }
                    },
                    {
                        $lookup: {
                            from: 'products',
                            let: { products: "$product" },
                            pipeline: [
                                {
                                    $match: {
                                        "$expr": {
                                            "$eq": [("$_id"), ("$$products")]
                                        }
                                    }
                                },
                                { $sort: { createdAt: -1 } },
                                { $limit: 1 },
                            ],
                            as: 'products'
                        }
                    },
                    { "$unwind": "$products" },
                    {
                        $lookup: {
                            from: 'buyproducts',
                            let: { buyproducts: "$buyproducts" },
                            pipeline: [
                                {
                                    $match: {
                                        "$expr": {
                                            "$eq": [("$_id"), ("$$buyproducts")]
                                        }
                                    }
                                },
                                { $sort: { createdAt: -1 } },
                                { $limit: 1 },
                            ],
                            as: 'buyproducts'
                        }
                    },
                    { "$unwind": "$buyproducts" },
                    {
                        $lookup: {
                            from: 'users',
                            let: { user: "$user" },
                            pipeline: [
                                {
                                    $match: {
                                        "$expr": {
                                            "$eq": [("$_id"), ("$$user")]
                                        }
                                    }
                                },
                                { $limit: 1 }
                            ],
                            as: 'user'
                        }
                    },
                    { "$unwind": "$user" },
                    {
                        $lookup: {
                            from: 'productorderhistories',
                            let: { buyProductOrderId: "$_id" },
                            pipeline: [
                                {
                                    $match: {
                                        "$expr": {
                                            "$eq": [("$buyProductOrderId"), ("$$buyProductOrderId")]
                                        },
                                        status: true
                                    }
                                },
                                { $sort: { createdAt: -1 } },
                                { $limit: 1 },
                            ],
                            as: 'productorderhistory'
                        }
                    },
                    { "$unwind": "$productorderhistory" },

                ])
                await EmailService.emailNotification(inv[0].user.email, inv[0]);
                return SendResponse(res, { inv }, 'Status changed');
            } else {
                return SendResponse(res, {}, 'status already existed');
            }
        } catch (error) {
            console.log(error);
            return SendResponse(res, Boom.badImplementation("Opps something wents wrong"));
        }
    },
    //admin particular order detail
    orderDetails: async (req, res) => {
        try {
            let { id } = req.params
            let inv = await BuyProductOrdersModel.aggregate([
                {
                    $match: {
                        _id: ObjectId(id)
                    }
                },
                {
                    $lookup: {
                        from: 'products',
                        let: { products: "$product" },
                        pipeline: [
                            {
                                $match: {
                                    "$expr": {
                                        "$eq": [("$_id"), ("$$products")]
                                    }
                                }
                            },
                            { $limit: 1 }
                        ],
                        as: 'products'
                    }
                },
                { "$unwind": "$products" },
                {
                    $lookup: {
                        from: 'buyproducts',
                        let: { buyproducts: "$buyproducts" },
                        pipeline: [
                            {
                                $match: {
                                    "$expr": {
                                        "$eq": [("$_id"), ("$$buyproducts")]
                                    }
                                }
                            },
                            { $limit: 1 }
                        ],
                        as: 'buyproducts'
                    }
                },
                { "$unwind": "$buyproducts" },
                {
                    $lookup: {
                        from: 'users',
                        let: { user: "$user" },
                        pipeline: [
                            {
                                $match: {
                                    "$expr": {
                                        "$eq": [("$_id"), ("$$user")]
                                    }
                                }
                            },
                            { $limit: 1 }
                        ],
                        as: 'user'
                    }
                },
                { "$unwind": "$user" },

            ])
            console.log(inv, 'dlnksdlk')
            let resultData = inv.length ? inv[0] : {};
            return SendResponse(res, resultData, "Data Saved");
        } catch (error) {
            console.log(error);
            return SendResponse(res, Boom.badImplementation("Opps something wents wrong"));
        }
    }
}

async function sendOrderNotification(orderId) {
    let inv = await BuyProductOrdersModel.aggregate([
        {
            $match: {
                _id: ObjectId(orderId)
            }
        },
        {
            $lookup: {
                from: 'products',
                let: { products: "$product" },
                pipeline: [
                    {
                        $match: {
                            "$expr": {
                                "$eq": [("$_id"), ("$$products")]
                            }
                        }
                    },
                    { $sort: { createdAt: -1 } },
                    { $limit: 1 },
                ],
                as: 'products'
            }
        },
        { "$unwind": "$products" },
        {
            $lookup: {
                from: 'buyproducts',
                let: { buyproducts: "$buyproducts" },
                pipeline: [
                    {
                        $match: {
                            "$expr": {
                                "$eq": [("$_id"), ("$$buyproducts")]
                            }
                        }
                    },
                    { $sort: { createdAt: -1 } },
                    { $limit: 1 },
                ],
                as: 'buyproducts'
            }
        },
        { "$unwind": "$buyproducts" },
        {
            $lookup: {
                from: 'users',
                let: { user: "$user" },
                pipeline: [
                    {
                        $match: {
                            "$expr": {
                                "$eq": [("$_id"), ("$$user")]
                            }
                        }
                    },
                    { $limit: 1 }
                ],
                as: 'user'
            }
        },
        { "$unwind": "$user" },
        {
            $lookup: {
                from: 'productorderhistories',
                let: { buyProductOrderId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            "$expr": {
                                "$eq": [("$buyProductOrderId"), ("$$buyProductOrderId")]
                            },
                            status: true
                        }
                    },
                    { $sort: { createdAt: -1 } },
                    { $limit: 1 },
                ],
                as: 'productorderhistory'
            }
        },
        { "$unwind": "$productorderhistory" },

    ])
    await EmailService.emailNotification(inv[0].user.email, inv[0]);
}