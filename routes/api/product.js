const express = require('express');
const checkAuth = require('../../middleware/authenticated');
const productController = require('../../controllers/productController');
const PaymentController = require('../../controllers/PaymentController');
const router = express.Router();
/** Dashboard */
router.post('/add', productController.add);
router.post('/update', productController.update);
router.post('/update/images', productController.updateImages);
router.post('/list', productController.list);
router.post('/my/list', productController.list);//vendor
router.post('/all/list', productController.productlist);//user
router.post('/all/features-list', productController.productlist);//user
router.post('/admin/list', productController.productListAdmin);//user
router.get('/detail', productController.details);
router.post('/update/status', productController.updateStatus);
router.post('/edit', productController.edit);
router.get('/specification/list', productController.specification);
router.post('/image/update', productController.imageUpdate);
router.post('/payment', PaymentController.productPayment);
module.exports = router;