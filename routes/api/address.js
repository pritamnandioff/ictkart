const express = require("express");
const addressController = require("../../controllers/addressController");
const router = express.Router();

router.post("/list", addressController.list);
router.post("/add", addressController.add);
router.post("/update", addressController.update);
// router.post("/detail", addressController.detail);

module.exports = router;