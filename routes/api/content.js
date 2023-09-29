const express = require("express");
const contentController = require("../../controllers/contentController");
const router = express.Router();

router.get("/list", contentController.getList);
router.post("/add", contentController.create);
router.post("/update", contentController.update);
router.post("/detail", contentController.detail);

module.exports = router;