const express = require("express");
const bannerController = require("../../controllers/bannerController");
const router = express.Router();

router.get("/list", bannerController.getList);
router.post("/add", bannerController.create);
router.post("/update", bannerController.update);
router.post("/detail", bannerController.details);
router.post("/dropdown/list", bannerController.getDropDownList);
// -----------------------//
router.get("/pramotion/list", bannerController.getListPramotionalBanner);
router.post("/pramotion/add", bannerController.createPramotionalBanner);
router.post("/pramotion/detail", bannerController.detailsPramotionalBanner);

module.exports = router;