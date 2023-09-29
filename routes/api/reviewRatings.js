const express = require("express");
const reviewsController = require("../../controllers/reviewsController");
const router = express.Router();

router.post('/add', reviewsController.add);
router.get("/list", reviewsController.ratingandreviewlist);
router.post("/approve", reviewsController.approveReviewed);
router.post('/detail', reviewsController.reviewDetail);
router.post('/product/list', reviewsController.reviewsByProduct);
// router.post('/update', reviewsController.update);

module.exports = router;