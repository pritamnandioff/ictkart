const express = require("express");
const brandController = require("../../controllers/brandController");
const router = express.Router();

router.post('/add', brandController.add);
router.get("/list", brandController.getList);
router.get("/dropdown/list", brandController.dropdownList);
router.post('/update/status', brandController.changeAccountStatus);
router.post('/detail', brandController.detail);
router.post('/update', brandController.update);

module.exports = router;