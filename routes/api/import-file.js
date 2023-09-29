const express = require('express');
const checkAuth = require('../../middleware/authenticated');
const impFileController = require('../../controllers/import-file/importFileController');
const router = express.Router();
/** Dashboard */
router.post('/category', impFileController.importCategory);
router.post('/product', impFileController.importProduct);
router.post('/brand', impFileController.importBrand);
router.post('/faq', impFileController.importFaq);
router.post('/vendor', impFileController.importVendor);
router.post('/user', impFileController.importVendor);
module.exports = router;