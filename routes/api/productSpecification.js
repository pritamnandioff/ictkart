const express = require("express");
const productSpecificationController = require("../../controllers/productSpecificationController");
const router = express.Router();

router.post('/add', productSpecificationController.add);
// router.get("/list", productSpecificationController.getList);
// router.get("/dropdown/list", productSpecificationController.dropdownList);
// router.post('/update/status', productSpecificationController.changeAccountStatus);
// router.post('/detail', productSpecificationController.detail);
// router.post('/update', productSpecificationController.update);

module.exports = router;