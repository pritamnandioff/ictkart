const Boom = require('@hapi/boom');
const UserModel = require('../models/User');
const ProductModel = require('../models/Product');
const BuyProductOrdersModal = require('../models/BuyProductOrders');
const SendResponse = require('../services/apiHandler');
module.exports = {
    dashboard: async (req, res) => {
        try {
            let dasObj = {
                user: 0,
                seller: 0,
                stock: 0,
                sales: 0,
                orders: 0,
                shipped: 0,
                outfordelivery: 0,
                returns: 0,
                cancels: 0
            }
            dasObj.user = await UserModel.countDocuments({ role: 'user' });
            dasObj.seller = await UserModel.countDocuments({ role: 'vendor' });
            dasObj.stock = await ProductModel.countDocuments({});
            let ord = await BuyProductOrdersModal.aggregate([
                {
                    $project: {
                        vendor: 1,
                        sellingPrice: { $cond: [{ $eq: ["$orderStatus", 'delivered'] }, "$sellingPrice", 0] },
                        'ordered': { $cond: [{ $eq: ["$orderStatus", 'ordered'] }, 1, 0] },
                        'shipped': { $cond: [{ $eq: ["$orderStatus", 'shipped'] }, 1, 0] },
                        'outForDelivery': { $cond: [{ $eq: ["$orderStatus", 'outForDelivery'] }, 1, 0] },
                        'delivered': { $cond: [{ $eq: ["$orderStatus", 'delivered'] }, 1, 0] },
                        'return': { $cond: [{ $eq: ["$orderStatus", 'return'] }, 1, 0] },
                        'cancel': { $cond: [{ $eq: ["$orderStatus", 'cancel'] }, 1, 0] }
                    }
                },
                {
                    $group: {
                        _id: "$orderStatus",
                        'totalProductOrders': { $sum: 1 },
                        'totalOrdered': { $sum: "$ordered" },
                        'totalShipped': { $sum: "$shipped" },
                        'totalOutForDelivery': { $sum: "$outForDelivery" },
                        'totalDelivered': { $sum: "$delivered" },
                        'totalReturn': { $sum: "$return" },
                        'totalCancel': { $sum: "$cancel" },
                    }
                }
            ]);
            dasObj.orders = ord && ord.length ? ord[0]['totalOrdered'] : 0;
            dasObj.shipped = ord && ord.length ? ord[0]['totalShipped'] : 0;
            dasObj.outfordelivery = ord && ord.length ? ord[0]['totalOutForDelivery'] : 0;
            dasObj.sales = ord && ord.length ? ord[0]['totalDelivered'] : 0;
            dasObj.returns = ord && ord.length ? ord[0]['totalReturn'] : 0;
            dasObj.cancels = ord && ord.length ? ord[0]['totalCancel'] : 0;

            return SendResponse(res, dasObj, 'Dashboard successfully');
        } catch (error) {
            console.log(error);
            return SendResponse(res, error);
        }
    },
}