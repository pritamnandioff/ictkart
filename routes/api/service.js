const express = require('express');
const checkAuth = require('../../middleware/authenticated');
const serviceController = require('../../controllers/serviceController');
const router = express.Router();
router.post('/add', serviceController.add);
router.post('/edit', serviceController.edit);
router.post('/update', serviceController.update);
router.post('/list', serviceController.list);/////vendor
router.post('/list/all', serviceController.servicelist);/////all web 
router.post('/cart', serviceController.cartList);/////all web 
router.post('/list/a-all', serviceController.serviceListAdmin);/////all admin 
router.post('/detail', serviceController.details);
router.post('/update/status', serviceController.updateStatus);
router.post('/update/images', serviceController.updateImages);
module.exports = router;