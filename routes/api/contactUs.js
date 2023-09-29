const express = require("express");
const contactusController = require("../../controllers/contactusController");
const router = express.Router();

router.post("/add", contactusController.add);
router.post("/list", contactusController.list);
router.post("/reply", contactusController.reply);

module.exports = router;