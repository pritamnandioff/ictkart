const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const WishListModel = require("../models/WishList");
const SendResponse = require("../services/apiHandler");
const Boom = require('@hapi/boom');
module.exports = {
    add: async (req, res) => {
        try {
            let { fr = 'product' } = req.body;
            let updateObj = { productId: req.body.productId };
            if (fr != 'product') {
                updateObj = { serviceId: req.body.productId };
            }
            let existData = await WishListModel.findOne({ userId: req.body.userId, type: req.body.type }, { type: 1, productId: 1 });
            if (existData) {
                existData = JSON.parse(JSON.stringify(existData));
                let eps = fr == 'product' ? existData.productId || [] : existData.serviceId || [];
                let isexist = eps.some((data) => data.toString() == (req.body.productId).toString())
                if (req.body.type == 'wishlist' && isexist) {
                    await WishListModel.findOneAndUpdate({ userId: req.body.userId, type: req.body.type }, {
                        $pull: updateObj
                    }, { new: true });
                    return SendResponse(res, { status: false }, `data removed`);
                }
                else {
                    await WishListModel.findOneAndUpdate({ userId: req.body.userId, type: req.body.type }, {
                        $addToSet: updateObj
                    }, { new: true });
                }
            }
            else {
                if (fr == 'product') {
                    req.body.productId = [req.body.productId];
                }
                else {
                    req.body.serviceId = [req.body.productId];
                    delete req.body.productId;
                }
                let data = new WishListModel(req.body);
                data = await data.save();
            }
            return SendResponse(res, { status: true }, `data added`);
        } catch (err) {
            console.log(err);
            return SendResponse(res, Boom.badImplementation("Opps something wents wrong"));
        }
    },
    update: async (req, res) => {
        try {
            let existUser = await WishListModel.findOne({ _id: req.body.wishId });
            if (!existUser) {
                return SendResponse(res, Boom.notFound("Record not found"));
            }
            else {
                let exists = await WishListModel.findOneAndUpdate({ _id: req.body.wishId }, req.body, { new: true });
                if (exists) {
                    return SendResponse(res, {}, "Record updated");
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
            let data = await WishListModel.findOneAndUpdate({ _id: req.body.wishId }, { $set: { status: req.body.status } }, { new: true })
            if (data) {
                return SendResponse(res, { data: data }, 'Record updated');
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
            let query = {
                type: req.body.type || 'cart',
                status: true,
                userId: req.query.userId
            }
            let list = await WishListModel.find(query);
            let total = await WishListModel.countDocuments(query);
            return SendResponse(res, { list: list, total: total }, 'wish List');
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
            let data = await WishListModel.findOne({ _id: req.query.wishId });
            return SendResponse(res, { data: data }, 'data');
        } catch (err) {
            console.log(err);
            return SendResponse(
                res,
                Boom.badImplementation("Opps something wents wrong")
            );
        }
    }
}