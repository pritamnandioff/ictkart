const CategoryModel = require("../../models/Categories");
const ProductModel = require("../../models/Product");
const CompanyInfoModel = require("../../models/companyInfo");
const BrandModel = require("../../models/Brand");
const ManufacturerModel = require("../../models/Manufacturer");
const UserModel = require("../../models/User");
const FaqsModel = require("../../models/Faqs");
// const ObjectId = require('mongodb').ObjectId;
const SendResponse = require('../../services/apiHandler');
const Boom = require('@hapi/boom');
const constant = require("../../config/keys");
const bcrypt = require("bcryptjs");
const FileService = require('../../services/file-service');
const { createSlug } = require('../../services/helper');
const categoriesController = require("../categoriesController");
const path = require('path');
const fs = require('fs');
const XLSX = require("xlsx");
const async = require("async");
const countryData = require('../../countryData.json');
function arrayEquals(a, b) {
    a = a.sort();
    b = b.sort();
    return Array.isArray(a) &&
        Array.isArray(b) &&
        a.length === b.length &&
        a.every((val, index) => val === b[index]);
}
const EMPTY_ARR = [null, 'null', undefined, 'undefined', "", " ", "  "];
function readStreamExcel(stream/*:ReadStream*/, cb/*:(wb:Workbook)=>void*/)/*:void*/ {
    var buffers = [];
    stream.on('data', function (data) { buffers.push(data); });
    stream.on('end', function () {
        let buffer = Buffer.concat(buffers);
        const workbook = XLSX.read(buffer, {
            type: "buffer",
            WTF: true
        });
        const sheetNames = workbook.SheetNames;
        const worksheet = workbook.Sheets[sheetNames[0]];
        const result = XLSX.utils.sheet_to_json(worksheet);
        const columnsArray = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0];
        cb(result, columnsArray);
    });
}
module.exports = {
    importCategory: async (req, res) => {
        try {
            let file = req.files.file;
            let fileExt = path.extname(file.name).slice(1);
            if (!ALLOWED_IMPORT_FILE_TYPES.includes(fileExt.toLowerCase())) {
                return SendResponse(res, Boom.badData('Only excel file allow'));
            }
            let fileName = file.name;
            const impFilePath = path.join(__dirname, `../../uploads/${file.name}`);
            file.mv(impFilePath, async (err) => {
                if (err) {
                    fs.unlinkSync((path.join(__dirname, `../../uploads/${fileName}`)));
                    return SendResponse(res, Boom.badData('Somethings wents wrong to upload file'));
                }
                let categories = await CategoryModel.findAllSlugs();
                let catObj = {};
                let subcatObj = {};
                if (categories) {
                    categories = JSON.parse(JSON.stringify(categories));
                    categories.map(c => {
                        catObj[c.slug + '###' + c.type] = c._id;
                        subcatObj[c.parentId + '###' + c.slug] = c._id;
                    });
                }
                const readable = fs.createReadStream(impFilePath);
                let allowColumnsArray = ['Category', 'SubCategory', 'Type'];
                let valid_data = [], invalid_data = [];
                readStreamExcel(readable, async (result, columnsArray) => {
                    var errors = [];
                    /** Check header matched or not */
                    let missmatchHeader = arrayEquals(columnsArray, allowColumnsArray);
                    if (!missmatchHeader) {
                        return SendResponse(res, Boom.badData('Header key not matched'));
                    }
                    else {
                        var errors = [];
                        for (const obj of result) {
                            if (EMPTY_ARR.includes(obj.Category)) { errors.push('Empty Category not allow!') };
                            // if (obj.SubCategory && obj.SubCategory.trim() == '') { errors.push('Empty SubCategory not allow!') };
                            if (EMPTY_ARR.includes(obj.Type)) { errors.push('Empty Type not allow!') };
                            if (obj.Type && obj.Type.trim() != '' && !['product', 'service', 'solution'].includes(obj.Type.trim())) { errors.push('Type not found!') };

                            if (errors && errors.length) {
                                obj['resion'] = (errors.join(" / ")); errors = [];
                                invalid_data.push(obj);
                            }
                            else {
                                obj.Type = obj.Type.trim().toLowerCase();
                                obj.Category = obj.Category.trim();
                                let slug = createSlug(obj.Category);
                                if (catObj[slug + '###' + obj.Type]) {
                                    obj.parentId = catObj[slug + '###' + obj.Type]
                                }
                                else {
                                    let cate = new CategoryModel({ title: obj.Category, slug: slug, type: obj.Type });
                                    cate = await cate.save();
                                    obj.parentId = cate._id;
                                    catObj[slug + '###' + obj.Type] = cate._id;
                                }
                                /** Sub Category */
                                if (!EMPTY_ARR.includes(obj.SubCategory)) {
                                    let subslug = createSlug(obj.SubCategory);
                                    if (!subcatObj[obj.parentId + '###' + subslug]) {
                                        valid_data.push({
                                            title: obj.SubCategory,
                                            slug: subslug,
                                            parentId: obj.parentId,
                                            type: obj.Type
                                        });
                                    }
                                    else {
                                        obj['resion'] = 'SubCategory allready exist';
                                        invalid_data.push(obj);
                                    }
                                }
                            }
                        }
                        fs.unlinkSync(impFilePath);
                        if (valid_data.length) await CategoryModel.insertMany(valid_data);
                        return SendResponse(res, { invalid_data: invalid_data, valid_data: valid_data.length }, 'Import successfully');
                    }
                });
            });
        } catch (error) {
            console.log('error', error);
            return SendResponse(res, Boom.badData(error));
        }
    },
    importProduct: async (req, res) => {
        try {
            let file = req.files.file;
            let fileExt = path.extname(file.name).slice(1);
            if (!ALLOWED_IMPORT_FILE_TYPES.includes(fileExt.toLowerCase())) {
                return SendResponse(res, Boom.badData('Only excel file allow'));
            }
            let fileName = file.name;
            const impFilePath = path.join(__dirname, `../../uploads/${file.name}`);
            file.mv(impFilePath, async (err) => {
                if (err) {
                    fs.unlinkSync((path.join(__dirname, `../../uploads/${fileName}`)));
                    return SendResponse(res, Boom.badData('Somethings wents wrong to upload file'));
                }
                const readable = fs.createReadStream(impFilePath);
                let allowColumnsArray = ["title", "modelNumber", "partNumber", "description", "category1", "category2", "category3", "brand", "sellingPrice", "originalPrice", "totalUnits", "vendor_email", "about", "image_url1", "image_url2", "image_url3", "image_url4", "image_url5"];
                req.body.return = 'rtn';
                let categories = await categoriesController.getDropDownList(req, res);
                let catObj = {};
                let parentCategoryObj = {};
                let category3Obj = {};
                if (categories) {
                    categories = JSON.parse(JSON.stringify(categories));
                    categories.map(c => {
                        parentCategoryObj[c.slug] = c.value;
                        c.subcategories.map(s => {
                            catObj[s.slug] = s.value;
                            s.subcategories3.map(s => {
                                category3Obj[s.slug] = s.value;
                                return s;
                            });
                            return s;
                        });
                        return c;
                    });
                }

                let brands = await BrandModel.findAllSlug();
                let brandObj = {};
                if (brands) {
                    brands = JSON.parse(JSON.stringify(brands));
                    brands.map(c => brandObj[c.slug] = c._id);
                }

                let vendors = await UserModel.findVendor();
                let vendorsObj = {};
                if (vendors) {
                    vendors = JSON.parse(JSON.stringify(vendors));
                    vendors.map(c => vendorsObj[c.email.toLowerCase()] = c._id);
                }
                let vCurrencies = await CompanyInfoModel.findVendorCurrency();
                let currencyObj = {};
                if (vCurrencies) {
                    vCurrencies = JSON.parse(JSON.stringify(vCurrencies));
                    vCurrencies.map(c => currencyObj[c.vendorId.toString()] = c.currency);
                }
                let valid_data = [], invalid_data = [];
                readStreamExcel(readable, async (result, columnsArray) => {
                    let missmatchHeader = arrayEquals(columnsArray, allowColumnsArray);
                    if (!missmatchHeader) {
                        return SendResponse(res, Boom.badRequest('Header key not matched'));
                    }
                    else {
                        var errors = [];
                        for (const obj of result) {
                            let category1slug = createSlug(obj.category1);
                            let category2slug = createSlug(obj.category2);
                            let category3slug = createSlug(obj.category3);

                            if (obj.title && obj.title.trim() == '') { errors.push('Empty title not allow!') };
                            if (obj.modelNumber && EMPTY_ARR.includes(obj.modelNumber.toString().trim())) { errors.push('Empty modelNumber not allow!') };
                            if (obj.partNumber && EMPTY_ARR.includes(obj.partNumber.toString().trim())) { errors.push('Empty partNumber not allow!') };

                            if (EMPTY_ARR.includes(obj.category1)) { errors.push('Empty categories not allow!') };
                            if (obj.category1 && obj.category1.trim() != '' && !parentCategoryObj[category1slug]) { errors.push('Parent category not found!') };

                            if (obj.category1 && obj.category1.trim() != '' && parentCategoryObj[category1slug]) {
                                if (obj.category2 && !EMPTY_ARR.includes(obj.category2.trim()) && !catObj[category2slug]) {
                                    errors.push('category2 not found');
                                }
                                if (obj.category2 && !EMPTY_ARR.includes(obj.category2.trim()) && catObj[category2slug]) {
                                    if (obj.category3 && !EMPTY_ARR.includes(obj.category3.trim()) && category3Obj[category3slug]) {
                                        errors.push('category2 required!');
                                    }
                                }
                                if (EMPTY_ARR.includes(obj.category2) && obj.category3 && !EMPTY_ARR.includes(obj.category3.trim())) {
                                    errors.push('category2 required!');
                                }
                                // if (obj.category2 == '' && obj.category3 == '') {
                                //     errors.push('category2 or category3 is required!');
                                // }
                            };


                            if (obj.brand && obj.brand.trim() == '') { errors.push('Empty brand not allow!') };
                            if (EMPTY_ARR.includes(obj.sellingPrice)) { errors.push('Empty sellingPrice not allow!') };
                            if (EMPTY_ARR.includes(obj.originalPrice)) { errors.push('Empty originalPrice not allow!') };
                            if (EMPTY_ARR.includes(obj.totalUnits)) { errors.push('Empty totalUnits not allow!') };
                            if (obj.vendor_email && obj.vendor_email.trim() == '') { errors.push('Empty vendor_email not allow!') };

                            if (obj.vendor_email && obj.vendor_email.trim() != '' && !vendorsObj[obj.vendor_email.trim().toLowerCase()]) {
                                errors.push('Empty vendor_email not registered!');
                            }
                            else {
                                obj['vender'] = null;
                                obj['currency'] = 'AED';
                            }
                            if (obj.vendor_email && obj.vendor_email.trim() != '' && vendorsObj[obj.vendor_email.trim().toLowerCase()]) {
                                obj['vender'] = vid = vendorsObj[obj.vendor_email.trim().toLowerCase()];
                                if (!currencyObj[obj['vender']]) {
                                    errors.push('Vendor profile not updated!')
                                }
                                obj['currency'] = currencyObj[obj['vender']];
                            }
                            if (errors && errors.length) {
                                obj['resion'] = (errors.join(" / ")); errors = [];
                                if (obj) invalid_data.push(obj);
                            }
                            else {
                                obj.imageUrl = [obj.image_url1, obj.image_url2, obj.image_url3, obj.image_url4, obj.image_url5].filter(i => !["", " ", undefined, "undefined", null, "null"].includes(i));
                                // obj.categoryOBJ = obj.category3 ? obj.category3 : obj.category2;
                                obj.categories = parentCategoryObj[category1slug];
                                obj.categories2 = catObj[category2slug] || null;
                                obj.categories3 = category3Obj[category3slug] || null;
                                // let slug = createSlug(obj.categoryOBJ);
                                // if (catObj[slug]) {
                                //     obj.categories = catObj[slug]
                                // }
                                // else {
                                //     let cate = new CategoryModel({ title: obj.categoryOBJ, slug: slug });
                                //     cate = await cate.save();
                                //     obj.categories = cate._id;
                                // }
                                /** Brand */
                                let brand_slug = createSlug(obj.brand);
                                if (brandObj[brand_slug]) {
                                    obj.brand = brandObj[brand_slug];
                                }
                                else {
                                    let cate = new BrandModel({ title: obj.brand, slug: brand_slug });
                                    cate = await cate.save();
                                    obj.brand = cate._id;
                                    brandObj[brand_slug] = cate._id;
                                }
                                valid_data.push(obj);
                            }
                        }
                        fs.unlinkSync(impFilePath);
                        await ProductModel.insertMany(valid_data);
                        let msg = `Total ${valid_data.length} import successfully and ${invalid_data.length} failed`;
                        return SendResponse(res, { totalimported: valid_data.length, totalfailed: invalid_data.length, invalid_data: invalid_data }, msg);
                    }
                })
            });
        } catch (error) {
            console.log(error);
            return SendResponse(res, Boom.badData(error));
        }
    },
    importBrand: async (req, res) => {
        try {
            let file = req.files.file;
            let fileExt = path.extname(file.name).slice(1);
            if (!ALLOWED_IMPORT_FILE_TYPES.includes(fileExt.toLowerCase())) {
                return SendResponse(res, Boom.badData('Only excel file allow'));
            }
            let fileName = file.name;
            const impFilePath = path.join(__dirname, `../../uploads/${file.name}`);
            file.mv(impFilePath, async (err) => {
                if (err) {
                    fs.unlinkSync((path.join(__dirname, `../../uploads/${fileName}`)));
                    return SendResponse(res, Boom.badData('Somethings wents wrong to upload file'));
                }
                let brands = await BrandModel.findAllSlug();
                brands = brands.map(obj => (obj.slug));

                const readable = fs.createReadStream(impFilePath);
                let allowColumnsArray = ['title', 'description'];
                readStreamExcel(readable, async (result, columnsArray) => {
                    /** Check header matched or not */
                    let missmatchHeader = arrayEquals(columnsArray, allowColumnsArray);
                    if (!missmatchHeader) {
                        return SendResponse(res, Boom.badRequest('Header key not matched'));
                    }
                    else {
                        var errors = []; let valid_data = [], invalid_data = [];
                        for (const obj of result) {
                            if (obj.title && obj.title.trim() == '') { errors.push('Empty question not allow!') };
                            let slug = createSlug(obj.title);
                            if (obj.title && brands.includes(slug)) { errors.push('Brand already exist') }

                            if (errors && errors.length) {
                                obj['resion'] = (errors.join(" / ")); errors = [];
                                invalid_data.push(obj);
                            }
                            else {
                                obj['slug'] = slug;
                                valid_data.push(obj);
                            }
                        }
                        fs.unlinkSync(impFilePath);
                        if (valid_data.length) await BrandModel.insertMany(valid_data);
                        return SendResponse(res, { invalid_data: invalid_data, valid_data: valid_data.length }, 'Import successfully');
                    }
                });
            });
        } catch (error) {
            console.log(error);
            return SendResponse(res, Boom.badData(error));
        }
    },
    importFaq: async (req, res) => {
        try {
            let file = req.files.file;
            let fileExt = path.extname(file.name).slice(1);
            if (!ALLOWED_IMPORT_FILE_TYPES.includes(fileExt.toLowerCase())) {
                return SendResponse(res, Boom.badData('Only excel file allow'));
            }
            const impFilePath = path.join(__dirname, `../../uploads/${file.name}`);
            file.mv(impFilePath, async (err) => {
                if (err) {
                    fs.unlinkSync(impFilePath);
                    return SendResponse(res, Boom.badData('Somethings wents wrong to upload file'));
                }
                let faqs = await FaqsModel.findAllQuestion();
                faqs = faqs.map(obj => (obj.question).toLowerCase());
                const readable = fs.createReadStream(impFilePath);
                let allowColumnsArray = ['question', 'answer'];
                readStreamExcel(readable, async (result, columnsArray) => {
                    /** Check header matched or not */
                    let missmatchHeader = arrayEquals(columnsArray, allowColumnsArray);
                    if (!missmatchHeader) {
                        return SendResponse(res, Boom.badRequest('Header key not matched'));
                    }
                    else {
                        var errors = [];
                        let data = result.reduce((accObj, obj) => {
                            if (obj.question && obj.question.trim() == '') { errors.push('Empty question not allow!') };
                            if (obj.answer && obj.answer.trim() == '') { errors.push('Empty answer not allow!') };
                            if (obj.question && faqs.includes(obj.question.toLowerCase())) { errors.push('Question already exist') }
                            if (errors && errors.length) {
                                obj['resion'] = (errors.join(" / ")); errors = [];
                                accObj.invalid_data.push(obj);
                            }
                            else {
                                accObj.valid_data.push(obj);
                            }
                            return accObj;
                        }, { valid_data: [], invalid_data: [] });
                        fs.unlinkSync(impFilePath);
                        let valid_data = data.valid_data;
                        await FaqsModel.insertMany(valid_data);
                        return SendResponse(res, data, 'Import successfully');
                    }
                });
            });
        } catch (error) {
            console.log(error);
            return SendResponse(res, Boom.badData(error));
        }
    },
    importVendor: async (req, res) => {
        try {
            let file = req.files.file;
            let fileExt = path.extname(file.name).slice(1);
            if (!ALLOWED_IMPORT_FILE_TYPES.includes(fileExt.toLowerCase())) {
                return SendResponse(res, Boom.badData('Only excel file allow'));
            }
            const impFilePath = path.join(__dirname, `../../uploads/${file.name}`);
            let segment = req.path.split("/");
            let roleStr = segment[segment.length - 1];
            file.mv(impFilePath, async (err) => {
                if (err) {
                    fs.unlinkSync(impFilePath);
                    return SendResponse(res, Boom.badData('Somethings wents wrong to upload file'));
                }
                let usersArr = await UserModel.findAllUsers();
                let mobiles = [], emails = [], countryObj = {};
                usersArr.map(obj => {
                    emails.push(obj.email);
                    mobiles.push(obj.mobile.toString());
                });
                countryData.map((ob) => countryObj[ob.name.toLowerCase()] = ob.iso_code_2)
                /** Read file */
                const readable = fs.createReadStream(impFilePath);
                let allowUserColumnsArray = ['firstName', 'lastName', 'country', 'email', 'password', 'mobile', 'dialCode'];
                if (roleStr != 'user') {
                    allowUserColumnsArray.push('companyName', 'vendorDescription');
                }
                readStreamExcel(readable, async (result, columnsArray) => {
                    /** Check header matched or not */
                    let missmatchHeader = arrayEquals(columnsArray, allowUserColumnsArray);
                    if (!missmatchHeader) {
                        return SendResponse(res, Boom.badRequest('Header key not matched'));
                    }
                    else {
                        var errors = []; let valid_data = [], invalid_data = [];
                        for (const obj of result) {
                            if (obj.firstName && obj.firstName.trim() == '') { errors.push('Empty firstName not allow!') };
                            if (req.body.role == 'vendor' && obj.companyName && obj.companyName.trim() == '') { errors.push('Empty companyName not allow!') };
                            if (obj.country && obj.country.trim() == '') { errors.push('Empty country not allow!') };
                            if (obj.country && obj.country.trim() != '' && !countryObj[obj.country.toLowerCase()]) { errors.push('Wrong country name') };

                            if (obj.email && obj.email.trim() == '') { errors.push('Empty email not allow!') };
                            if (obj.email && obj.email.trim() != '' && emails.includes(obj.email.trim())) { errors.push('Email allready exist!') };

                            if (obj.password && obj.password.toString().trim() == '') { errors.push('Empty password not allow!') };
                            if (obj.mobile && obj.mobile.toString().trim() == '') { errors.push('Empty mobile not allow!') };
                            if (obj.mobile && obj.mobile.toString().trim() != '' && mobiles.includes(obj.mobile.toString().trim())) { errors.push('Mobile allready exist!') };

                            if (obj.dialCode && obj.dialCode.toString().trim() == '') { errors.push('Empty dialCode not allow!') };

                            if (errors && errors.length) {
                                obj['resion'] = (errors.join(" / ")); errors = [];
                                invalid_data.push(obj);
                            }
                            else {
                                obj['iso2'] = countryObj[obj.country.toLowerCase()];
                                obj['role'] = roleStr;
                                valid_data.push(obj);
                                obj.password = await bcrypt.hash(obj.password.toString().trim(), constant.saltRounds);
                                emails.push(obj.email);
                                mobiles.push(obj.mobile);
                            }
                        }
                        fs.unlinkSync(impFilePath);
                        if (valid_data.length) await UserModel.insertMany(valid_data);
                        return SendResponse(res, { invalid_data: invalid_data, valid_data: valid_data.length }, 'Import successfully');
                    }
                });
            });
        } catch (err) {
            console.log(err);
            return SendResponse(res, Boom.badRequest(err));
        }
    }
}