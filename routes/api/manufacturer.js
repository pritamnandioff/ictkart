const express = require("express");
const manufacturerController = require("../../controllers/manufacturerController");
const router = express.Router();

router.post('/add', manufacturerController.add);
router.get("/list", manufacturerController.getList);
router.get("/dropdown/list", manufacturerController.dropdownList);
router.post('/update/status', manufacturerController.changeAccountStatus);
router.post('/detail', manufacturerController.detail);
router.post('/update', manufacturerController.update);

module.exports = router;