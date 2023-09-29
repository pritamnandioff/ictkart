const Banner = require("../models/Banner");
const fs = require('fs');
const path = require('path');
const ObjectId = require('mongodb').ObjectId;
const SendResponse = require('../services/apiHandler');
const Boom = require('@hapi/boom');
const { createSlug } = require('../services/helper');
const FileService = require('../services/file-service');
const PramotionalBanner = require("../models/PramotionalBanner");

exports.getList = async (req, res) => {
    try {
        let queryObj = {
            ...(req.query.displayAt && { displayAt: req.query.displayAt }),
            ...(req.query.status && { status: req.query.status })
        }
        const banners = await Banner.find(queryObj);
        let total = await Banner.countDocuments();
        return SendResponse(res, { banners, total }, 'Business type list');
    } catch (err) {
        console.log(err);
        return SendResponse(res, Boom.badImplementation('Opps something wents wrong'));
    }
}
exports.details = async (req, res) => {
    try {
        const banners = await Banner.findOne({ _id: req.body.bannerId });
        return SendResponse(res, banners, 'Business type list');
    } catch (err) {
        console.log(err);
        return SendResponse(res, Boom.badImplementation('Opps something wents wrong'));
    }
}
exports.getDropDownList = async (req, res) => {
    try {
        let query = {
            ...(req.body.displayAt && { displayAt: req.body.displayAt })
        }
        const banners = await Banner.find(query, { title: 1 });
        return SendResponse(res, banners, 'Business type list');
    } catch (err) {
        console.log(err);
        return SendResponse(res, Boom.badImplementation('Opps something wents wrong'));
    }
}
//create banner
exports.create = async (req, res) => {
    try {
        if (req.files) {
            req.body.image = await FileService.uploadImage(req.files.image);
        }
        let ban = new Banner(req.body);
        ban = await ban.save();
        return SendResponse(res, ban, 'Banner is added successfully');
    } catch (err) {
        console.log(err);
        return SendResponse(res, Boom.badImplementation('Opps something wents wrong'));
    }
}
//update banner
exports.update = async (req, res) => {
    try {
        if (req.files) {
            req.body.image = await FileService.uploadImage(req.files.image);
        }
        else {
            delete req.body.image;
        }
        let ban = await Banner.findOneAndUpdate({ _id: req.body.bannerId }, { $set: req.body }, { new: true });
        return SendResponse(res, ban, 'Banner is updated successfully');
    } catch (err) {
        console.log(err);
        return SendResponse(res, Boom.badImplementation('Opps something wents wrong'));
    }
}

// ---------------------------
exports.getListPramotionalBanner = async (req, res) => {
    try {
        let queryObj = {
            ...(req.query.displayAt && { displayAt: req.query.displayAt }),
            ...(req.query.status && { status: req.query.status })
        }
        let banners = await PramotionalBanner.find(queryObj);
        if (banners) {
            banners = JSON.parse(JSON.stringify(banners));
            let bannersType = banners.map(ob => ob.displayAt);
            let existingBanners = banners.map((b, i) => {
                b['first']['image'] = IMG_URL + b['first']['image'];
                b['second']['image'] = IMG_URL + b['second']['image'];
                b['third']['image'] = IMG_URL + b['third']['image'];
                b['fourth']['image'] = IMG_URL + b['fourth']['image'];
                return b
            })
            let missingBanners = [];
            ['home', 'product', 'service'].forEach((b, i) => {
                if (!bannersType.includes(b)) {
                    missingBanners.push({
                        'displayAt': b,
                        ...PRAMOTIONAL_BANNER
                    })
                }
            })
            banners = [...existingBanners, ...missingBanners];
        }
        else {
            banners = ['home', 'product', 'service'].map((b, i) => {
                return {
                    'displayAt': b,
                    ...PRAMOTIONAL_BANNER
                }
            })
        }
        return SendResponse(res, banners, 'Business type list');
    } catch (err) {
        console.log(err);
        return SendResponse(res, Boom.badImplementation('Opps something wents wrong'));
    }
}
exports.detailsPramotionalBanner = async (req, res) => {
    try {
        let queryObj = {
            ...(req.body.displayAt && { displayAt: req.body.displayAt })
        }
        let banners = await PramotionalBanner.findOne(queryObj);
        if (banners) {
            banners = JSON.parse(JSON.stringify(banners));
            banners['first']['image'] = IMG_URL + banners['first']['image'];
            banners['second']['image'] = IMG_URL + banners['second']['image'];
            banners['third']['image'] = IMG_URL + banners['third']['image'];
            banners['fourth']['image'] = IMG_URL + banners['fourth']['image'];
        }
        else {
            banners = PRAMOTIONAL_BANNER
        }
        return SendResponse(res, banners, 'Business type list');
    } catch (err) {
        console.log(err);
        return SendResponse(res, Boom.badImplementation('Opps something wents wrong'));
    }
}

exports.createPramotionalBanner = async (req, res) => {
    try {
        if (req.files) {
            req.body.image = await FileService.uploadImage(req.files.image);
        }
        else {
            delete req.body.image;
        }
        let existPB = await PramotionalBanner.findOne({ displayAt: req.body.displayAt });
        if (existPB) {
            existPB = JSON.parse(JSON.stringify(existPB));
            let obj = {
                [req.body.key]: {
                    image: req.body.image || existPB[req.body.key]['image'],
                    targetUrl: req.body.targetUrl,
                }
            }
            let ban = await PramotionalBanner.findOneAndUpdate({ displayAt: req.body.displayAt }, { $set: obj }, { new: true });
            return SendResponse(res, ban, 'Banner is updated successfully');
        }
        else {
            let obj = {
                [req.body.key]: {
                    image: req.body.image || '',
                    targetUrl: req.body.targetUrl,
                },
                displayAt: req.body.displayAt
            }
            let ban = new PramotionalBanner(obj);
            ban = await ban.save();
            return SendResponse(res, ban, 'Banner is added successfully');
        }
    } catch (err) {
        console.log(err);
        return SendResponse(res, Boom.badImplementation('Opps something wents wrong'));
    }
}