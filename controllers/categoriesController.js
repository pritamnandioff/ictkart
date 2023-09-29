const Categories = require("../models/Categories");
const ObjectId = require('mongodb').ObjectId;
const SendResponse = require('../services/apiHandler');
const { createSlug } = require('../services/helper');
const Boom = require('@hapi/boom');
const FileService = require('../services/file-service');
module.exports = {
    getList: async (req, res) => {
        try {
            let queryObj = {
                ...(req.query.type && { type: req.query.type })
            }
            let { page, limit = 10 } = req.query;
            limit = parseInt(limit) || 10;
            let skip = page * limit - limit || 0;
            const category = await Categories.find(queryObj)
                .populate('parentId', "title slug")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);
            const total = await Categories.countDocuments(queryObj);
            return SendResponse(res, { list: category, total: total }, 'Business type list');
        } catch (err) {
            console.log(err);
        }
    },
    getDropDownList: async (req, res) => {
        try {
            let { type = "" } = req.query;
            type = [undefined, null, "", " ", 'undefined', 'null'].includes(type) ? ['product', 'service', 'solution'] : [type];
            let queryObj = {
                type: { $in: type },
                parentId: null
            }
            if (req.body.categories) {
                queryObj = {
                    _id: ObjectId(req.body.categories)
                }
            }
            const category = await Categories.aggregate([
                { $match: queryObj },
                {
                    $lookup: {
                        "from": "categories",
                        "let": { parentId: "$_id" },
                        "pipeline": [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ["$parentId", "$$parentId"]
                                    }
                                }
                            },
                            {
                                $lookup: {
                                    "from": "categories",
                                    "let": { parentId: "$_id" },
                                    "pipeline": [
                                        {
                                            $match: {
                                                $expr: {
                                                    $eq: ["$parentId", "$$parentId"]
                                                }
                                            }
                                        },
                                        {
                                            $project: {
                                                value: "$_id",
                                                label: "$title",
                                                slug: "$slug",
                                                icon: {
                                                    $cond: {
                                                        if: { $eq: ["$icon", ""] },
                                                        then: PRODUCT_URL,
                                                        else: { $concat: [IMG_URL, "$icon"] },
                                                    }
                                                },
                                            }
                                        }
                                    ],
                                    "as": "subcategories"
                                }
                            },
                            {
                                $project: {
                                    value: "$_id",
                                    label: "$title",
                                    slug: "$slug",
                                    icon: {
                                        $cond: {
                                            if: { $eq: ["$icon", ""] },
                                            then: PRODUCT_URL,
                                            else: { $concat: [IMG_URL, "$icon"] },
                                        }
                                    },
                                    subcategories3: "$subcategories"
                                }
                            }
                        ],
                        "as": "subcategories"
                    }
                },
                {
                    $project: {
                        value: "$_id",
                        label: "$title",
                        slug: "$slug",
                        icon: {
                            $cond: {
                                if: { $eq: ["$icon", ""] },
                                then: PRODUCT_URL,
                                else: { $concat: [IMG_URL, "$icon"] },
                            }
                        },
                        subcategories: 1
                    }
                }
            ]);
            if (req.body.categories) {
                return category.length ? category[0] : { subcategories: [] };
            }
            if (req.body.return == 'rtn') { return category }
            return SendResponse(res, { list: category }, 'Business type list');
        } catch (err) {
            console.log(err);
        }
    },
    getDropDownSubCategoryList: async (req, res) => {
        try {
            let { type = "" } = req.query;
            type = [undefined, null, "", " ", 'undefined', 'null'].includes(type) ? ['product', 'service', 'solution'] : [type];
            let queryObj = {
                type: { $in: type },
                parentId: { $nin: [null] }
            }
            const category = await Categories.aggregate([
                { $match: queryObj },
                {
                    $project: {
                        value: "$_id",
                        label: "$title",
                        icon: {
                            $cond: {
                                if: { $eq: ["$icon", ""] },
                                then: PRODUCT_URL,
                                else: { $concat: [IMG_URL, "$icon"] },
                            }
                        }
                    }
                }
            ]);
            return SendResponse(res, { list: category }, 'Business type list');
        } catch (err) {
            console.log(err);
        }
    },
    categoryDetail: async (req, res) => {
        try {
            let categoryDetail = await Categories.findOne({ _id: req.query.categoryId });
            // if (existUser.status == false) {
            //   return SendResponse(
            //     res,
            //     Boom.badRequest("Your account has been deactivated."),
            //     "Your account has been deactivated.",
            //     2
            //   );
            // }
            return SendResponse(res, { category: categoryDetail }, "user details");
        } catch (err) {
            console.log(err);
            SendResponse(res, Boom.badImplementation(err));
        }
    },
    changeAccountStatus: async (req, res) => {
        try {
            let existUser = await Categories.findOne({ _id: req.body.categoryId });
            if (existUser) {
                existUser = await Categories.findOneAndUpdate({ _id: req.body.categoryId }, { $set: { status: req.body.status } }, { new: true })
                return SendResponse(res, existUser, 'Record updated');
            } else {
                return SendResponse(res, {}, 'Record not found');
            }
        } catch (error) {
            console.log(error);
            return SendResponse(res, Boom.badImplementation());
        }
    },
    create: async (req, res) => {
        try {
            req.body.parentId = ['', null, 'null', " "].includes(req.body.parentId) ? null : req.body.parentId;
            req.body.slug = createSlug(req.body.title);
            let existCat = await Categories.find({ title: req.body.title });
            if (existCat.length > 1) {
                return SendResponse(res, {}, Boom.badRequest("already exist"));
            }
            if (req.files && req.files.image) {
                req.body.image = await FileService.uploadImage(req.files.image);
            }
            if (req.files && req.files.icon) {
                req.body.icon = await FileService.uploadImage(req.files.icon);
            }
            if (req.body.serviceSubCategory !== undefined && req.body.serviceSubCategory != '') {
                req.body.serviceSubCategory = JSON.parse(req.body.serviceSubCategory);
            }
            let cat = new Categories(req.body);
            const category = await cat.save();
            return SendResponse(res, category, 'Business type list');
        } catch (err) {
            console.log(err);
            return SendResponse(res, Boom.badImplementation(err));
        }
    },
    update: async (req, res) => {
        try {
            let existUser = await Categories.findOne({ _id: req.body.categoryId });
            if (existUser) {
                req.body.parentId = ['', null, 'null', " "].includes(req.body.parentId) ? existUser.parentId : req.body.parentId;
                if (req.files && req.files.image) {
                    req.body.image = await FileService.uploadImage(req.files.image);
                }
                else {
                    delete req.body.image;
                }
                if (req.files && req.files.icon) {
                    req.body.icon = await FileService.uploadImage(req.files.icon);
                }
                else {
                    delete req.body.icon;
                }
                if (req.body.serviceSubCategory && req.body.serviceSubCategory != "") {
                    req.body.serviceSubCategory = JSON.parse(req.body.serviceSubCategory);
                }
                else {
                    delete req.body.serviceSubCategory;
                }
                await Categories.findOneAndUpdate({ _id: req.body.categoryId }, {
                    $set: req.body
                }, { new: true });
                return SendResponse(res, {}, 'Record updated');
            }
            else {
                return SendResponse(res, {}, 'Record not found');
            }
        } catch (err) {
            console.log(err);
            return SendResponse(res, Boom.badImplementation(err));
        }
    },
}