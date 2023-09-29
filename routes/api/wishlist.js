const express = require('express');
const checkAuth = require('../../middleware/authenticated');
const wishlistController = require('../../controllers/wishlistController');
const router = express.Router();
/** Dashboard */
router.post('/add', wishlistController.add);
router.post('/update', wishlistController.update);
router.get('/list', wishlistController.list);
router.get('/detail', wishlistController.details);
router.post('/update/status', wishlistController.updateStatus);
module.exports = router;