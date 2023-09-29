const mongoose = require("mongoose");
const ObjectID = require('mongodb').ObjectID;
const ObjectId = mongoose.Types.ObjectId;
const productModel = require("../models/Product");
const UserModel = require("../models/User");
const { generatePassword, generateProductId, generateOtp, capitalizeFirst } = require("../util/index");
const SendResponse = require("../services/apiHandler");
const Helper = require("../services/helper");
const FileService = require("../services/file-service");
const EmailService = require("../services/email-service");
const UserService = require("../services/user-service");
const Boom = require('@hapi/boom');
const WishListModel = require("../models/WishList");
const categoriesController = require("./categoriesController");
const moment = require("moment");
var fs = require('fs');
let ejs = require("ejs");
let path = require("path");
const puppeteer = require('puppeteer');
const BuyProductOrders = require("../models/BuyProductOrders");
module.exports = {
    add: async (req, res) => {
        try {
            let isVendorDocs = await Helper.checkActiveStatus(req.body.vender);
            if (!isVendorDocs) {
                return SendResponse(res, { isVendorDocs }, "please, upload your documents and get verify first from your admin");
            }
            let existproduct = await productModel.findOne({ partNumber: capitalizeFirst(req.body.partNumber) });
            // if (existproduct) {
            //     return SendResponse(res, Boom.notFound("Product id allready exist"));
            // }
            req.body.sellingPrice = Number(req.body.sellingPrice)
            req.body.originalPrice = Number(req.body.originalPrice)
            req.body.totalUnits = Number(req.body.totalUnits)
            req.body.title = capitalizeFirst(req.body.title)
            let vendorCompany = await Helper.userCompanyInfo(req.body.vender);
            if (!vendorCompany) {
                return SendResponse(res, Boom.notFound("Vendor shop not updated"));
            }
            // req.body.code = await Helper.generateProductCode();
            req.body.currency = vendorCompany.currency;
            let newProduct = new productModel(req.body);
            let data = await newProduct.save();
            return SendResponse(res, data, `Product added`);
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
            let existproduct = await productModel.findOne({ _id: req.body.productId });
            if (!existproduct) {
                return SendResponse(res, Boom.notFound("Product not found"));
            }
            else {
                let exists = await productModel.findOneAndUpdate({ _id: req.body.productId }, req.body, { new: true });
                if (exists) {
                    return SendResponse(res, {}, "Product updated");
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
    updateImages: async (req, res) => {
        try {
            let existproduct = await productModel.findOne({ _id: req.body.productId });
            if (!existproduct) {
                return SendResponse(res, Boom.notFound("Product not found"));
            }
            else {
                if (req.files) {
                    if (req.files.images !== undefined && req.files.images) {
                        let images = await FileService.uploadImage(req.files.images, true);
                        if ([undefined, null, "", 'undefined', 'null', " "].includes(req.body.removeimage)) {
                            existproduct = JSON.parse(JSON.stringify(existproduct));
                            let remainingImage = [];
                            if (existproduct.images && Array.isArray(existproduct.images)) {
                                let removeimage = JSON.parse(req.body.removeimage);
                                existproduct.images.filter((item) => {
                                    if (!removeimage.includes(item)) {
                                        remainingImage.push(item);
                                        return item;
                                    }
                                })
                            }
                            images = [...images, ...remainingImage];
                        }

                        await productModel.findOneAndUpdate({ _id: req.body.productId }, {
                            $push: { images: images }
                        }, { new: true });
                    }
                }
                return SendResponse(res, {}, "Product updated");
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
            let existproduct = await productModel.findOneAndUpdate({ _id: req.body.productId }, { $set: { status: req.body.status } }, { new: true })
            if (existproduct) {
                return SendResponse(res, { data: existproduct }, 'Record updated');
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
            let query = {
                vender: req.body.userId
            };
            let { search = "" } = req.body
            if (search != null && search != undefined && search != "") {
                query = Object.assign(query, {
                    $or: [
                        { title: { $regex: ".*" + search + ".*", $options: 'i' } },
                        { modelNumber: { $regex: ".*" + search + ".*", $options: 'i' } }
                    ]
                });
            }
            let total = await productModel.countDocuments(query);
            // query.vender = (query.vender);
            let list = await productModel.find(query)
                .populate('categories')
                .populate('brand', "title image")
                .populate('manufacturer', "title image")
                .sort({ createdAt: -1 })


            return SendResponse(res, { list: list, total: total }, 'product List');
        } catch (err) {
            console.log(err);
            return SendResponse(
                res,
                Boom.badImplementation("Oops something wents wrong")
            );
        }
    },
    productlist: async (req, res) => {
        try {
            let userData = await UserService.Auth(req);
            req.body.userId = userData ? userData.id : req.body.userId;
            let { page = 1, limit = 50, search = "", type = '', brand = [], price = "", maxPrice = "", minPrice = "", category = "", product = null, sort = 'popularity', order = "desc" } = req.body;
            let skip = page * limit - limit || 0;
            limit = parseInt(limit) || 10;

            let query = { status: true };
            let totalQuery = { status: true };
            let segment = req.path.split("/");
            let roleStr = segment[segment.length - 1];
            if (roleStr == 'features-list') {
                query.isFeatured = true;
            }
            let products = [];
            let favouritesArr = [];
            let favouritesObj = await WishListModel.findOne({ type: 'wishlist', userId: req.body.userId }, { productId: 1 });
            if (favouritesObj) {
                favouritesObj = JSON.parse(JSON.stringify(favouritesObj));
                favouritesArr = favouritesObj.productId.map(pro => ObjectId(pro));
            }
            let favourites = await WishListModel.findOne({ type: type, userId: req.body.userId }, { productId: 1 });
            if (favourites) {
                favourites = JSON.parse(JSON.stringify(favourites));
                products = favourites.productId.map(pro => ObjectId(pro));
            }
            if (['view', 'wishlist'].includes(type)) {
                products = products && products.filter(obj => obj._id.toString() != product)
                query._id = { $in: products }
                totalQuery = query;
            }
            if (brand.length) {
                brand = brand.map(b => ObjectId(b))
                query.brand = { $in: brand }
            }
            if (maxPrice != "" || minPrice != "") {
                // let mrp = price.split("-");
                // query.sellingPrice = { $gte: Number(mrp[0]), $lt: Number(mrp[1]) }
                query.sellingPrice = { $gte: Number(minPrice), $lte: Number(maxPrice) }
            }
            if (category != "") {
                category = category.map(b => ObjectId(b))
                query.categories = { $in: category }
            }
            if (search != null && search != undefined && search != "") {
                query = Object.assign(query, {
                    $or: [
                        { title: { $regex: ".*" + search + ".*", $options: 'i' } },
                        { modelNumber: { $regex: ".*" + search + ".*", $options: 'i' } }
                    ]
                });
            }
            /** Sorting */
            switch (sort) {
                case 'popularity':
                    sort = 'averageRating';
                    order = "desc";
                    break;
                case 'new':
                    sort = 'createdAt';
                    order = "desc";
                    break;
                case 'high_to_low':
                    sort = 'sellingPrice';
                    order = "desc";
                    break;
                case 'low_to_high':
                    sort = 'sellingPrice';
                    order = "asc";
                    break;
            }

            order = order == "desc" ? -1 : 1;
            let sortObj = {
                [sort || 'createdAt']: order
            };
            let total = await productModel.countDocuments(query);
            /** End of the sorting */
            let list = await productModel.aggregate([
                { $match: query },
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
                                    ratingFor: 'product',
                                    isApproved: true,
                                    status: true
                                }
                            },
                            {
                                $project: {
                                    rate: 1,
                                    // comment:1,
                                }
                            }
                        ],
                        "as": "ratings"
                    }
                },
                {
                    $project: {
                        ratings: 1,
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
                        sellingPrice: 1,
                        originalPrice: 1,
                        currency: 1,
                        images: {
                            $map: {
                                input: "$images",
                                as: "images",
                                in: { $concat: [IMG_URL, "$$images"] },
                            },
                        },
                        imageUrl: 1,
                        images: { $concatArrays: ["$imageUrl", "$images"] },
                        thumbnail: {
                            $cond: [
                                { $gte: [{ $size: "$images" }, 1] },
                                { $concat: [IMG_URL, { $arrayElemAt: ["$images", 0] }] },
                                {
                                    $cond: [
                                        { $gte: [{ $size: "$imageUrl" }, 1] },
                                        { $arrayElemAt: ["$imageUrl", 0] },
                                        PRODUCT_URL
                                    ]
                                }
                            ]
                        }
                    }
                },
                {
                    $addFields: {
                        isFavourite: { $in: ["$_id", favouritesArr] }
                    }
                },
                { $sort: sortObj },
                { $skip: skip },
                { $limit: limit }
            ]);
            return SendResponse(res, { total: total, list: list }, 'list');

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
            let product = await productModel.aggregate([
                {
                    $match: {
                        _id: ObjectId(req.query.productId)
                    }
                },
                {
                    $lookup: {
                        "from": "reviewratings",
                        "let": { productId: "$_id" },
                        "pipeline": [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ["$productId", "$$productId"]
                                    }
                                }
                            },
                            {
                                $project: {
                                    "ratingFor": 1,
                                    "rate": 1,
                                }
                            },
                            { $match: { ratingFor: 'product' } }
                        ],
                        as: "ratings"
                    }
                },
                {
                    $project: {
                        vender: 1,
                        currency: 1,
                        modelNumber: 1,
                        partNumber: 1,
                        countries: 1,
                        releaseDate: 1,
                        expiryDate: 1,
                        title: 1,
                        description: 1,
                        code: 1,
                        categories: 1,
                        brand: 1,
                        manufacturer: 1,
                        sellingPrice: 1,
                        originalPrice: 1,
                        conditions: 1,
                        isFeatured: 1,
                        thumbnail: {
                            $cond: {
                                if: { $eq: ["$thumbnail", ""] },
                                then: "",
                                else: { $concat: [IMG_URL, "$thumbnail"] },
                            }
                        },
                        imageUrl: 1,
                        images: {
                            $concatArrays: [{
                                $cond: {
                                    if: { $isArray: "$images" },
                                    then: {
                                        $map: {
                                            input: "$images",
                                            as: "images",
                                            in: { $concat: [IMG_URL, "$$images"] },
                                        },
                                    },
                                    else: []
                                }
                            }, "$imageUrl"]
                        },
                        specifications: {
                            $cond: {
                                if: { "$eq": [{ "$type": "$specifications" }, "missing"] },
                                then: [],
                                else: "$specifications"
                            }
                        },
                        totalUnits: 1,
                        soldUnits: 1,
                        status: 1,
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
                        ratingData: {
                            $cond: {
                                if: { $isArray: "$ratings" },
                                then: {
                                    $reduce: {
                                        input: "$ratings",
                                        initialValue: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                                        in: {
                                            1: {
                                                $cond: {
                                                    if: { $eq: ["$$this.rate", 1] },
                                                    then: { $add: ["$$value.1", 1] },
                                                    else: "$$value.1",
                                                },
                                            },
                                            2: {
                                                $cond: {
                                                    if: { $eq: ["$$this.rate", 2] },
                                                    then: { $add: ["$$value.2", 1] },
                                                    else: "$$value.2",
                                                },
                                            },
                                            3: {
                                                $cond: {
                                                    if: { $eq: ["$$this.rate", 3] },
                                                    then: { $add: ["$$value.3", 1] },
                                                    else: "$$value.3",
                                                },
                                            },
                                            4: {
                                                $cond: {
                                                    if: { $eq: ["$$this.rate", 4] },
                                                    then: { $add: ["$$value.4", 1] },
                                                    else: "$$value.4",
                                                },
                                            },
                                            5: {
                                                $cond: {
                                                    if: { $eq: ["$$this.rate", 5] },
                                                    then: { $add: ["$$value.5", 1] },
                                                    else: "$$value.5",
                                                },
                                            },
                                        },
                                    },
                                },
                                else: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                            },
                        },
                    }
                }
            ]);
            product[0]['brandData'] = await Helper.brandManufacturTitle(product[0]['brand']);
            let wishList = await Helper.wishListORview(req.query.userId, req.query.productId);
            let isProductInMyCart = await Helper.isProductInMyCart(req.query.userId, req.query.productId);
            product[0]['manufacturData'] = await Helper.brandManufacturTitle(product[0]['manufacturer']);
            product[0]['categoryData'] = await Helper.categoryTitle(product[0]['categories']);
            let user = await Helper.userProfile(product[0]['vender']);
            user['shop'] = await Helper.userCompanyInfo(product[0]['vender']);
            product[0]['services'] = await Helper.productRelatedServices(product[0]['categories'], product[0]['vender']);

            let productObj = { ...product[0], ...wishList, ...isProductInMyCart };
            return SendResponse(res, { user, product: productObj }, 'product details');
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
            let { modelNumber = "" } = req.body;
            let query = { _id: req.body.productId }
            if (modelNumber) {
                query = { modelNumber: modelNumber }
            }
            let existproduct = await productModel.findOne(query)
            if (existproduct) {
                existproduct = JSON.parse(JSON.stringify(existproduct));
                existproduct.images = existproduct.images ? existproduct.images.map(im => IMG_URL + im) : [];
                req.body.categories = existproduct.categories;
                existproduct.categoryObj = await categoriesController.getDropDownList(req, res);
                return SendResponse(res, existproduct, 'Success');
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
    // list for admin
    productListAdmin: async (req, res) => {
        try {
            let { page = 1, limit = 50, search = "" } = req.body
            let skip = page * limit - limit || 0;
            limit = parseInt(limit) || 10;
            let query = {}
            if (search != null && search != undefined && search != "") {
                query = Object.assign(query, {
                    $or: [
                        { title: { $regex: ".*" + search + ".*", $options: 'i' } },
                        { modelNumber: { $regex: ".*" + search + ".*", $options: 'i' } },
                        { "vendor.email": { $regex: ".*" + search + ".*", $options: 'i' } }
                    ]
                });
            }
            let total = await productModel.countDocuments(query);
            let list = await productModel.aggregate([
                // {
                //     $match: query
                // },
                {
                    $project: {
                        title: 1,
                        modelNumber: 1,
                        code: 1,
                        thumbnail: 1,
                        sellingPrice: 1,
                        originalPrice: 1,
                        totalUnits: 1,
                        soldUnits: 1,
                        status: 1,
                        currency: 1,
                        createdAt: 1,
                        partNumber: 1,
                        vender: 1,
                        isFeatured: 1,
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
                                    mobile: 1,
                                    email: 1
                                }
                            }
                        ],
                        as: "vendor"
                    }
                },
                {
                    $project: {
                        title: 1,
                        code: 1,
                        modelNumber: 1,
                        thumbnail: 1,
                        sellingPrice: 1,
                        originalPrice: 1,
                        totalUnits: 1,
                        soldUnits: 1,
                        status: 1,
                        currency: 1,
                        vendor: { $cond: [{ $gte: [{ $size: "$vendor" }, 1] }, { $arrayElemAt: ["$vendor", 0] }, {}] },
                        createdAt: 1,
                        partNumber: 1,
                        isFeatured: 1,
                    }
                },
                {
                    $match: query
                },
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: limit }
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
    specification: async (req, res) => {
        try {
            let specifications = [];
            return SendResponse(res, specifications, 'Success');
        } catch (err) {
            console.log(err);
            return SendResponse(res, Boom.badImplementation("Oops something wents wrong"));
        }
    },
    imageUpdate: async (req, res) => {
        try {
            let list = await productModel.find({ _id: req.body.productId });
            let productImages = []
            if (list) {
                if (req.files) {
                    if (Array.isArray(req.files.productImages)) {
                        for (let i = 0; i < req.files.productImages.length; i++) {
                            data = await FileService.uploadImage(req.files.productImages[i]);
                            console.log(data, 'dfsfdsd')
                            productImages.push(data);
                        }
                    } else {
                        data = await FileService.uploadImage(req.files.productImages);
                        productImages = data;
                    }
                }
            }
            let upload = await productModel.findOneAndUpdate({ _id: req.body.productId }, { $push: { images: productImages } }, { new: true });
            if (upload) {
                return SendResponse(res, { upload }, "Data Saved");
            } else {
                return SendResponse(res, Boom.badImplementation());
            }
        } catch (err) {
            console.log(err);
            return SendResponse(res, Boom.badImplementation("Oops something wents wrong"));
        }
    },
    deleteImage: async (req, res) => {
        try {
            let { imageUrl, images } = req.body
            let list = await productModel.find({ _id: req.body.productId });

            let productImages = []
            if (list) {
                if (req.files) {
                    if (Array.isArray(req.files.productImages)) {
                        for (let i = 0; i < req.files.productImages.length; i++) {
                            data = await FileService.uploadImage(req.files.productImages[i]);
                            // console.log(data, 'dfsfdsd')
                            productImages.push(data);
                        }
                    } else {
                        data = await FileService.uploadImage(req.files.productImages);
                        productImages = data;
                    }
                }
            }
            let upload = await productModel.findOneAndUpdate({ _id: req.body.productId }, { $set: { images: productImages } });
            if (upload) {
                return SendResponse(res, {}, "Data Saved");
            } else {
                return SendResponse(res, Boom.badImplementation());
            }
        } catch (err) {
            console.log(err);
            return SendResponse(res, Boom.badImplementation("Oops something wents wrong"));
        }
    },
    invoicePdf: async (req, res) => {
        try {
            let { id } = req.params
            let inv = await BuyProductOrders.aggregate([
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
                        ],
                        as: 'user'
                    }
                },
                { "$unwind": "$user" },

            ])
            // console.log(inv)
            // return SendResponse(res, {inv:inv}, "Data Saved");
            const file = await path.join(__dirname, '../views/invoice1.ejs');
            await ejs.renderFile(file, { report: inv, moment: moment }, async (err, html) => {
                if (err) {
                    console.log(err);
                }
                const browser = await puppeteer.launch({ args: ['--no-sandbox'], headless: true });

                const page = await browser.newPage();
                await page.setContent(html);
                var fileName = `${Date.now()} | ict-kart | ${moment().format('YYYY-MMM-DD')}` + '_.pdf';
                await page.pdf({
                    path: path.join(__dirname, `../public/${fileName}`),
                    format: 'A4',
                    displayHeaderFooter: false,
                    headerTemplate: '<div id="header-template" style="font-size:10px !important; color:#808080; padding-left:10px"><span class="date"></span>&nbsp;&nbsp;<span style="text-align: center;" class="title"></span></div>',
                    footerTemplate: '<div id="footer-template" style="width:100%;font-size:10px !important; color:#808080; padding-left:10px"><span class="date"></span>&nbsp;&nbsp;</span><span style="float: right;padding-right:10px"> Page: <span class="pageNumber"></span>/<span class="totalPages"></span></span></div>',
                    margin: {
                        top: '10px',
                        bottom: '10px',
                        right: '30px',
                        left: '30px',
                    },
                });

                const file = fs.readFileSync(path.join(__dirname, `../public/${fileName}`));
                // if (action == 'download') {
                res.setHeader('Content-disposition', `attachment; filename=${fileName}`);
                res.set('Content-Type', 'text/pdf');
                res.type('application/pdf');
                res.send(file);
                fs.unlinkSync((path.join(__dirname, `../public/${fileName}`)));
                await browser.close();
                // }
                // if (action == 'mail') {
                //     console.log(report.bookingId.userId.email);
                await EmailService.EmailAttachment(inv[0].user.email, `Please find the invoice report of your order in attached with this mail`, file);

                // }
            })
        } catch (err) {
            console.log(err);
            return SendResponse(res, Boom.badImplementation("Oops something wents wrong"));
        }
    }
}