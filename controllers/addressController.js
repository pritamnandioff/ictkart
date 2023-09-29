const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const AddressModel = require("../models/Address");
const Boom = require('@hapi/boom');
const SendResponse = require("../services/apiHandler");
module.exports = {
    add: async (req, res) => {
        try {
            let existAddress = await AddressModel.findOne({ userId: req.body.userId });
            req.body.address = {
                coordinates: [parseInt(req.body.long), parseInt(req.body.lat)],
                postalAddress: req.body.postalAddress,
                country: req.body.country,
                state: req.body.state,
                city: req.body.city,
                houseNo: req.body.houseNo,
                locality: req.body.locality,
                postcode: req.body.postcode,
            }
            if (existAddress) {
                await AddressModel.findOneAndUpdate({ userId: req.body.userId }, req.body, { new: true });
            }
            else {
                let cat = new AddressModel(req.body);
                await cat.save();
            }
            return SendResponse(res, {}, 'address added successfully');
        } catch (error) {
            console.log(error);
            return SendResponse(res, Boom.badImplementation("Opps something wents wrong"));
        }
    },
    list: async (req, res) => {
        try {
            let cat = await AddressModel.find({ userId: req.body.userId });
            return SendResponse(res, { list: cat }, 'Address list');
        } catch (error) {
            console.log(error);
            return SendResponse(res, Boom.badImplementation("Opps something wents wrong"));
        }
    },
    update: async (req, res) => {
        try {
            let cat = await AddressModel.findOne({ _id: req.body.addressId });
            if (cat) {
                if (req.body.postalAddress != undefined && req.body.postalAddress != "" && req.body.lat != undefined && req.body.lat != "" && req.body.long != undefined && req.body.long != "") {
                    req.body.address = {
                        coordinates: [parseInt(req.body.long), parseInt(req.body.lat)],
                        postalAddress: req.body.postalAddress,
                        country: req.body.country,
                        state: req.body.state,
                        city: req.body.city,
                        houseNo: req.body.houseNo,
                        locality: req.body.locality,
                        postcode: req.body.postcode,
                    }
                }
                await AddressModel.findOneAndUpdate({ _id: req.body.addressId }, req.body, { new: true });
                return SendResponse(res, {}, 'address updated successfully');
            } else {
                return SendResponse(res, product, 'No user found');
            }
        } catch (error) {
            console.log(error);
            return SendResponse(res, Boom.badImplementation("Opps something wents wrong"));
        }
    }
}