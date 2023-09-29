const CryptoJS = require("crypto-js");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const SECRET_KEY = require('../config/keys').SECRET_KEY;
const ProductModel = require("../models/Product");
const BrandModel = require("../models/Brand");
const CategoryModel = require("../models/Categories");
const WishListModel = require("../models/WishList");
const UserModel = require("../models/User");
const BuyProductOrdersModel = require("../models/BuyProductOrders");
const CompanyInfoModel = require("../models/companyInfo");
const ServicesModel = require("../models/Services");
const RoleModel = require("../models/Role");

module.exports = {
    encrypt: (data) => {
        let ciphertext = CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
        return ciphertext;
    },
    decrypt: (ciphertext) => {
        var bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
        var decryptedData = bytes.toString(CryptoJS.enc.Utf8);
        return decryptedData;
    },
    capitalizeFirst: (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    },
    initCap: (string) => {
        string = string.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
        return string;
    },
    generateOtp: () => {
        return Math.floor(1000 + Math.random() * 9000)
    },
    createSlug: (values) => {
        if (values) {
            values = values.trim();
            values = values.split(' ').join('-');
            values = values.split('/').join("-");
            return values.toLowerCase();
        }
        else {
            return '';
        }
    },
    generateProductCode: async () => {
        try {
            let product = await ProductModel.find({}, { code: 1 }).sort({ createdAt: -1 }).limit(1);
            var orderNumber = 1;
            if (product && product.length) {
                orderNumber = product[0].code ? product[0].code : 1;
                orderNumber = (orderNumber).substring(2);
                orderNumber = parseInt(orderNumber) + 1;
            }
            orderNumber = orderNumber.toString();
            orderNumber = 'PR' + orderNumber.padStart(8, '0');
            return orderNumber;
        } catch (error) {
            return Date.now();
        }
    },
    brandManufacturTitle: async (brandId) => {
        try {
            let brand = await BrandModel.findOne({ _id: brandId }, { title: 1 });
            return brand ? brand.title : "";
        } catch (error) {
            return "";
        }
    },
    categoryTitle: async (categoryId) => {
        try {
            let category = await CategoryModel.findOne({ _id: categoryId }, { title: 1 });
            return category ? category.title : "";
        } catch (error) {
            return "";
        }
    },
    wishListORview: async (userId, productId, type = "product") => {
        try {
            let query = { productId: productId };
            let proj = { productId: 1 };
            let key = 'productId';
            if (type == "service") {
                query = { serviceId: productId };
                proj = { serviceId: 1 };
                key = 'serviceId';
            }
            let wishlist = await WishListModel.find({
                userId: userId,
                ...query
            }, { type: 1 });
            let views = await WishListModel.findOne({ userId: userId, type: 'view' }, proj);
            let totalViewed = views && views[key] ? views[key].length : 0;
            let favourites = await WishListModel.findOne({ userId: userId, type: 'wishlist' }, proj);
            let totalFavourites = favourites && favourites[key] ? favourites[key].length : 0;
            let vf = { isView: false, isFavourite: false, totalViewed: totalViewed, totalFavourites: totalFavourites };
            if (wishlist) {
                wishlist.map(wl => {
                    if (wl.type == 'view') {
                        vf.isView = true;
                    }
                    if (wl.type == 'wishlist') {
                        vf.isFavourite = true;
                    }
                })
            }
            return vf;
        } catch (error) {
            return {
                isView: false,
                isFavourite: false,
                totalViewed: 0,
                totalFavourites: 0
            };
        }
    },
    isProductInMyCart: async (userId, productId) => {
        try {
            let user = await UserModel.findOne({ _id: userId, "carts.product": productId }, { mobile: 1 });
            if (user) {
                return { isCart: true };
            }
            return { isCart: false };
        } catch (error) {
            return { isCart: false };
        }
    },
    userProfile: async (userId) => {
        try {
            let user = await UserModel.aggregate([
                { $match: { _id: ObjectId(userId) } },
                { $limit: 1 },
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
                        "email": 1,
                        "companyName": 1,
                        "designation": 1,
                        "firstName": 1,
                        "lastName": 1,
                        "dialCode": 1,
                        "mobile": 1,
                        "vendorDescription": 1,
                        "avatar": {
                            $cond: {
                                if: { $eq: ["$avatar", ""] },
                                then: "",
                                else: { $concat: [IMG_URL, "$avatar"] },
                            }
                        },
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
                        socialInfo: 1,
                        address: 1,
                        createdAt: 1,
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
            ])
            return user.length ? user[0] : {};
        } catch (error) {
            return {};
        }
    },//62ee4f9f48f5060c75e743e0
    userAnanlysis: async (userId) => {
        try {
            let user = await BuyProductOrdersModel.aggregate([
                { $match: { vendor: ObjectId(userId) } },
                {
                    $project: {
                        vendor: 1,
                        sellingPrice: { $cond: [{ $eq: ["$orderStatus", 'delivered'] }, "$sellingPrice", 0] },
                        'ordered': { $cond: [{ $eq: ["$orderStatus", 'ordered'] }, 1, 0] },
                        'shipped': { $cond: [{ $eq: ["$orderStatus", 'shipped'] }, 1, 0] },
                        'outForDelivery': { $cond: [{ $eq: ["$orderStatus", 'outForDelivery'] }, 1, 0] },
                        'delivered': { $cond: [{ $eq: ["$orderStatus", 'delivered'] }, 1, 0] },
                        'deliveryComplete': { $cond: [{ $ne: ["$delivered", null] }, 1, 0] },
                        'return': { $cond: [{ $eq: ["$orderStatus", 'return'] }, 1, 0] },
                        'cancel': { $cond: [{ $eq: ["$orderStatus", 'cancel'] }, 1, 0] }
                    }
                },
                {
                    $group: {
                        _id: "$vendor",
                        totalSales: { $sum: "$sellingPrice" },
                        totalSelling: { $sum: 1 },
                        'totalOrdered': { $sum: "$ordered" },
                        'totalShipped': { $sum: "$shipped" },
                        'totalOutForDelivery': { $sum: "$outForDelivery" },
                        'totalDelivered': { $sum: "$delivered" },
                        'totalReturn': { $sum: "$return" },
                        'totalCancel': { $sum: "$cancel" },
                        'deliveryComplete':{ $sum:"$deliveryComplete"}
                    }
                }
            ]);
            if (user.length) {
                return user[0];
            }
            return { totalSales: 0, totalSelling: 0, totalOrdered: 0, totalShipped: 0, totalOutForDelivery: 0, totalDelivered: 0, totalReturn: 0, totalCancel: 0 };
        } catch (error) {
            return { totalSales: 0, totalSelling: 0, totalOrdered: 0, totalShipped: 0, totalOutForDelivery: 0, totalDelivered: 0, totalReturn: 0, totalCancel: 0 };
        }
    },
    userServiceAnanlysis: async (userId) => {
        try {
            return { totalServiceSales: 0, totalServiceSelling: 0, totalServiceOrdered: 0, totalServiceShipped: 0, totalServiceOutForDelivery: 0, totalServiceDelivered: 0, totalServiceReturn: 0, totalServiceCancel: 0 };
        } catch (error) {
            return { totalServiceSales: 0, totalServiceSelling: 0, totalServiceOrdered: 0, totalServiceShipped: 0, totalServiceOutForDelivery: 0, totalServiceDelivered: 0, totalServiceReturn: 0, totalServiceCancel: 0 };
        }
    },
    userSolutionAnanlysis: async (userId) => {
        try {
            return { totalSolutionSales: 0, totalSolutionSelling: 0, totalSolutionOrdered: 0, totalSolutionShipped: 0, totalSolutionOutForDelivery: 0, totalSolutionDelivered: 0, totalSolutionReturn: 0, totalSolutionCancel: 0 };
        } catch (error) {
            return { totalSolutionSales: 0, totalSolutionSelling: 0, totalSolutionOrdered: 0, totalSolutionShipped: 0, totalSolutionOutForDelivery: 0, totalSolutionDelivered: 0, totalSolutionReturn: 0, totalSolutionCancel: 0 };
        }
    },
    userCompanyInfo: async (vendorId) => {
        try {
            return await CompanyInfoModel.findOne({ vendorId: vendorId }, { slogan: 1, companyName: 1, currency: 1 });
        } catch (error) {
            console.log(error)
            return {};
        }
    },
    productRelatedServices: async (categoryId, vendorId) => {
        try {
            let category = await CategoryModel.findOne({ _id: categoryId }, { serviceSubCategory: 1 });
            if (category) {
                category = JSON.parse(JSON.stringify(category));
                let services = await ServicesModel.find({ vender: vendorId, subcategory: category.serviceSubCategory }, { title: 1, description: 1 }).populate('category', "title");
                return services;
            }
            return [];
        } catch (error) {
            console.log(error)
            return [];
        }
    },
    checkProductExist: async (vendorId) => {
        try {
            return await ProductModel.countDocuments({ vender: vendorId });
        } catch (error) {
            console.log(error)
            return false;
        }
    },
    getUserRole: async (vendorId) => {
        try {
            let user = await UserModel.findOne({ _id: vendorId }, { userRole: 1, vendor: 1 }).populate('userRole', "name permissions description");
            if (user) {
                user = JSON.parse(JSON.stringify(user));
                if ([null, undefined, "", 'null', 'undefined', " ",].includes(user.vendor)) {
                    return {
                        "name": "Super Admin",
                        "description": "Owner",
                        "permissions": JSON.stringify(USER_ROLE)
                    };
                }
                user = user ? user.userRole : {
                    "name": "Super Admin",
                    "description": "Owner",
                    "permissions": JSON.stringify(USER_ROLE)
                };
                return user
            }
            else {
                return {
                    "name": "Super Admin",
                    "description": "Product Manager test",
                    "permissions": JSON.stringify(USER_ROLE)
                };
            }
        }
        catch (error) {
            return {
                "name": "Super Admin",
                "description": "Product Manager test",
                "permissions": JSON.stringify(USER_ROLE)
            };
        }
    },
    checkActiveStatus: async (id) => {
        try {
            let existUser = await UserModel.findOne({ _id: id,role:"vendor" })
            if (existUser) {
              return existUser.verifyVendorAccount;
            } else {
              return false;
            }
        } catch (error) {
          return false;
        }
      },
}