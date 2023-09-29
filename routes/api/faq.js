const express = require('express');
const checkAuth = require('../../middleware/authenticated');
const faqController = require('../../controllers/faqController');
const router = express.Router();
/** Dashboard */
router.post('/add', faqController.add);
router.post('/update', faqController.update);
router.get('/list', faqController.list);
router.get('/detail', faqController.details);
router.post('/update/status', faqController.updateStatus);
module.exports = router;