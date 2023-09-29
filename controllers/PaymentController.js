const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const productModel = require("../models/Product");
const UserModel = require("../models/User");
const { generatePassword, generateProductId, generateOtp, capitalizeFirst } = require("../util/index");
const SendResponse = require("../services/apiHandler");
const Helper = require("../services/helper");
const FileService = require("../services/file-service");
const UserService = require("../services/user-service");
const Boom = require('@hapi/boom');
const WishListModel = require("../models/WishList");
const categoriesController = require("./categoriesController");
const { PUBLISHABLE_KEY, SECRET_KEY } = require("../config/keys")
const stripe = require('stripe')(SECRET_KEY);

module.exports = {
    productPayment: async (req, res) => {
        try {
            const token = await createToken(req.body);
            if (token.error) {
                console.log(token)
                return SendResponse(res, Boom.badImplementation(token.error));
            }
            if (!token.id) {
                return SendResponse(res, Boom.badImplementation('Payment failed.'));
            }
            const customer = await createNewCustomer(req);
            req.body.user_id = customer.id;
            const charge = await createCharge(token.id, req.body.user_id,req);
            if (charge && charge.status == 'succeeded') {
                return SendResponse(res, {}, "Payment completed.");
            }
            else {
                return SendResponse(res, Boom.badImplementation('Payment failed.'));
            }
        } catch (err) {
            console.log(err);
            return SendResponse(res, Boom.badImplementation("Oops something wents wrong"));
        }
    }
}
const createToken = async (cardData) => {
    let token = {};
    try {
        // token = await stripe.tokens.create({
        //     card: {
        //         name: cardData.cardHolderName,
        //         number: cardData.cardNumber,
        //         exp_month: parseInt(cardData.exp_month),
        //         exp_year: parseInt(cardData.exp_year),
        //         cvc: cardData.cvv,
        //         // "address_line1": req.body.address_line1 || "",
        //         // "address_line2": req.body.address_line2 || "",
        //         // "address_city": req.body.address_city || "",
        //         // "address_state": req.body.address_state || "",
        //         // "address_zip": req.body.address_zip || "",
        //         // "address_country": req.body.address_country || ""
        //     }
        // });
        token = await stripe.tokens.create({
            //   card: {
            //     number: '4242424242424242',
            //     exp_month: 5,
            //     exp_year: 2023,
            //     cvc: '314',
            //   },
            card: {
                number: cardData.number,
                exp_month: Number(cardData.exp_month),
                exp_year: Number(cardData.exp_year),
                cvc: Number(cardData.cvc),
              },
          });

    } catch (error) {
        switch (error.type) {
            case 'StripeCardError':
                token.error = error.message;
                break;
            default:
                token.error = error.message;
                break;
        }
    }
    return token;
}
const createNewCustomer = async (req) => {
    try {
        const customer = await stripe.customers.create({
            name: req.body.name,
            email: req.body.receipt_email,
            address: {
                line1: req.body.line1,
                postal_code: req.body.postal_code,
                city: req.body.city,
                state: req.body.state,
                country: req.body.country,
            }
            // name: "nitish",
            // email: "nabc@yopmail.com",
            // name: 'Gourav Hammad',
            // address: {
            //     line1: 'TC 9/4 Old MES colony',
            //     postal_code: '452331',
            //     city: 'Indore',
            //     state: 'Madhya Pradesh',
            //     country: 'US',
            // }
        });
        return customer;
    } catch (error) {
        return error.message;
    }
}
const createCharge = async (tokenId, cus,req) => {

    let charge = {};
    try {
        // let param = {
        //     amount: req.body.amount,
        //     currency: req.body.curreny || 'usd',
        //     description: req.body.description || "",
        //     customer: req.body.user_id,
        //     // source: req.body.source_id || tokenId,
        //     // receipt_email: req.body.receipt_email || ""
        // };
        let param = {
            amount: req.body.amount,
            currency: req.body.currency,
            description: req.body.description,
            // customer: cus,
            source: tokenId,
            statement_descriptor: req.body.statement_descriptor,
            receipt_email: req.body.receipt_email || ""
        };
        //  let param = {
        //     amount: 999,
        //     currency: 'aed',
        //     description: 'Example charge',
        //     source: tokenId,
        //     statement_descriptor: 'Custom descriptor',
        // };
        
        charge = await stripe.charges.create(param);
    } catch (error) {
        console.log(error);
        charge.error = error.message;
    }
    return charge;

    
}