const express = require("express");
const buyProductController = require("../../controllers/buyProductController");
const router = express.Router();

router.post('/add', buyProductController.add);
router.post("/list", buyProductController.list);
router.post("/admin/order/list", buyProductController.adminOrderList);
router.post("/change-status", buyProductController.changeStatus);
router.post("/change-order-status", buyProductController.changeStatus1);
router.get("/order-details/:id", buyProductController.orderDetails);

module.exports = router;