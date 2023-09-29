const JWT = require('jsonwebtoken')
const Boom = require('@hapi/boom');
const { JWT_SECRET } = require('../config/keys');
const AdminModel = require('../models/Admin');
const SendResponse = require('../services/apiHandler');
const helperService = require('../services/helper');
const constant = require('../config/keys');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs');
const { generatePassword } = require("../util/index");
const EmailService = require("../services/email-service");
const FileService = require('../services/file-service');
module.exports = {
    register: async (req, res) => {
        try {
            var newAdmin = new AdminModel(req.body);
            newAdmin.password = newAdmin.hash(req.body.password);
            newAdmin = await newAdmin.save();
            return SendResponse(res, newAdmin, 'Registration successfully');
        } catch (error) {
            console.log(error);
            return SendResponse(res, error);
        }
    },
    login: async (req, res) => {
        try {
            let user = await AdminModel.findOne({ email: req.body.email }).select('+password').lean().exec();
            let isPwd = await bcrypt.compare(req.body.password, user.password);
            if (isPwd) {
                let authToken = jwt.sign({
                    data: {
                        id: user._id,
                        email: user.email,
                    }
                }, `${constant.JWT_SECRET}`, { expiresIn: '168h' });
                delete user.password
                return SendResponse(res, { user: user, token: authToken }, 'User successfully logged In')
            } else {
                return SendResponse(res, Boom.badRequest('Invalid user name or password'));
            }
        } catch (error) {
            console.log(error);
            return SendResponse(res, Boom.badRequest('Opps something wents wrong'));
        }
    },
    list: async (req, res) => {
        try {
            // let { search = '' } = req.body;
            // let queryObj = {
            //     [Op.or]: [
            //         { name: { [Op.like]: `%${search}%` } },
            //         { email: { [Op.like]: `%${search}%` } },
            //     ]
            // };
            // let totalAdmins = await AdminModel.co({ where: queryObj });
            let admins = await AdminModel.find({});
            return SendResponse(res, { admins }, 'All admin list');
        } catch (error) {
            console.log(error.message);
            return SendResponse(res, { isBoom: true, statusCode: 500 }, 'Opps something wents wrong');
        }
    },
    adminDetail: async (req, res) => {
        try {
            let existId = await AdminModel.findOne({ _id: req.body.adminId });
            if (existId) {
                return SendResponse(res, existId, "details");
            } else {
                return SendResponse(res, Boom.badRequest("Invalid Admin Id"));
            }
        } catch (error) {
            return SendResponse(res, Boom.badRequest(""));
        }
    },
    adminPasswordUpdate: async (req, res) => {
        try {
            // let authData = await UserService.Auth(req);
            // req.body.oldPassword = req.body.old_password;
            // req.body.newPassword = req.body.password;
            await AdminModel.findOne({ _id: req.body.id }).select('+password').lean()
                .then(async (user) => {
                    if (user) {
                        let isPwd = await bcrypt.compare(req.body.oldPassword, user.password);
                        if (isPwd) {
                            let newPassword = await bcrypt.hash(req.body.newPassword, constant.saltRounds)
                            AdminModel.findOneAndUpdate({ _id: user._id }, { $set: { password: newPassword } }, { new: true })
                                .then(async (doc) => {
                                    return SendResponse(res, doc, `Password change successfully`);
                                })
                                .catch((err) => {
                                    return SendResponse(res, Boom.badImplementation());
                                })
                        } else {
                            return SendResponse(res, Boom.badRequest('Please enter valid old password'));
                        }
                    } else {
                        return SendResponse(res, Boom.notFound('Record not found'))
                    } /// user else block
                }).catch((err) => {
                    console.log(err);
                    return SendResponse(res, Boom.badRequest())
                })
        } catch (error) {
            console.log(error);
            return SendResponse(res, Boom.badImplementation());
        }
    },
    adminForgotPassword: async (req, res) => {
        try {
            await AdminModel.findOne({ email: req.body.email }).lean()
                .then(async (user) => {
                    if (user) {
                        let password = generatePassword();
                        EmailService.forgotPasswordEmail(req.body.email, password)
                        let newPassword = await bcrypt.hash(password, constant.saltRounds)
                        AdminModel.findOneAndUpdate({ email: req.body.email }, { $set: { password: newPassword } }, { new: true })
                            .then(async (doc) => {
                                return SendResponse(res, doc, `Please Check Your Mail`);
                            })
                            .catch((err) => {
                                return SendResponse(res, Boom.badImplementation());
                            })
                    } else {
                        return SendResponse(res, Boom.badRequest('Please enter correct Email Address'));
                    }
                }).catch((err) => {
                    console.log(err);
                    return SendResponse(res, Boom.badRequest())
                })
        } catch (error) {
            console.log(error);
            return SendResponse(res, Boom.badImplementation());
        }
    },
    adminUpdate: async (req, res) => {
        try {
            if (req.files != null) {
                req.body.profileImage = await FileService.uploadImage(req.files.profileImage);
            }
            let admin = await AdminModel.findOne({ _id: req.body.id }, { email: 1 });
            if (admin) {
                let { address } = admin.address;
                req.body.address = {
                    postalAddress: req.body.postalAddress || address.postalAddress,
                    country: req.body.country || admin.country,
                    state: req.body.state || admin.state,
                    city: req.body.city || admin.city,
                    zipCode: req.body.zipCode || admin.zipCode,
                    location: req.body.location || admin.location,
                    lat: 0,
                    long: 0
                };
                let user = await AdminModel.findOneAndUpdate({ _id: req.body.id }, { $set: req.body }, { new: true });
                return SendResponse(res, user, "Your profile updated successfully");
            }
            else {
                return SendResponse(res, Boom.notFound("Record not found"));
            }
        } catch (error) {
            console.log(error);
            return SendResponse(res, Boom.badRequest("Spmething wents wrong"));
        }
    },
}