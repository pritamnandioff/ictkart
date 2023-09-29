const express = require('express');
const checkAuth = require('../../middleware/authenticated');
const categoriesController = require('../../controllers/categoriesController');
const router = express.Router();

router.post('/add', categoriesController.create);
router.get('/list', categoriesController.getList);
router.get('/dropdown/list', categoriesController.getDropDownList);
router.get('/dropdown/list/sub', categoriesController.getDropDownSubCategoryList);
router.post('/update/status', categoriesController.changeAccountStatus);
router.post('/update', categoriesController.update);
router.get('/detail', categoriesController.categoryDetail);
module.exports = router;