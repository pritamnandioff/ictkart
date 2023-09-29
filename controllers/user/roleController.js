const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const SendResponse = require("../../services/apiHandler");
const Boom = require('@hapi/boom');
const UserModel = require("../../models/User");
const RoleModel = require("../../models/Role");
module.exports = {
    addRole: async (req, res) => {
        try {
            let existUser = await RoleModel.findOne({ name: req.body.name });
            if (!existUser) {
                existUser = new RoleModel(req.body);
                await existUser.save();
                return SendResponse(res, existUser, 'Record added');
            }
            else {
                return SendResponse(res, {}, 'Record not found', 0);
            }
        } catch (error) {
            return SendResponse(res, Boom.badImplementation());
        }
    },
    updateRole: async (req, res) => {
        try {
            let existUser = await RoleModel.findOne({ _id: req.body.roleId });
            if (existUser) {
                if (req.body.status == false) {
                    let existUser = await UserModel.findOne({ role: req.body.roleId });
                    if (existUser) {
                        return SendResponse(res, {}, 'Not Allow to inactive role, beacause of user already assigned this role', 0);
                    }
                }
                existUser = await RoleModel.findOneAndUpdate({ _id: req.body.roleId }, { $set: req.body }, { new: true })
                return SendResponse(res, existUser, 'Record updated');
            }
            else {
                return SendResponse(res, {}, 'Record not found', 0);
            }
        } catch (error) {
            return SendResponse(res, Boom.badImplementation());
        }
    },
    roleList: async (req, res) => {
        try {
            let list = await RoleModel.find({ vendor: req.body.vendorId });
            let count = await RoleModel.countDocuments({ vendor: req.body.vendorId });
            return SendResponse(res, { count, list }, 'Record list');
        } catch (error) {
            return SendResponse(res, Boom.badImplementation());
        }
    },
    roleDropdownList: async (req, res) => {
        try {
            let list = await RoleModel.find({ vendor: req.body.vendorId });
            if (list) {
                list = JSON.parse(JSON.stringify(list));
                list = list.map((obj) => {
                    return { label: obj.name, value: obj._id }
                })
            }
            return SendResponse(res, list, 'Record list');
        } catch (error) {
            return SendResponse(res, Boom.badImplementation());
        }
    },
}