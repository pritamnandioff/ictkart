const express = require('express');
const checkAuth = require('../../middleware/authenticated');
const AdminController = require('../../controllers/adminController');
const dashboardController = require('../../controllers/dashboardController');
const router = express.Router();
/** Dashboard */
router.post('/add', AdminController.register);
router.post('/login', AdminController.login);
router.post('/list', AdminController.list);
router.post('/detail', AdminController.adminDetail);
router.post('/forgot/password', AdminController.adminForgotPassword);
router.post('/update/password', AdminController.adminPasswordUpdate);
router.post('/profile/update', AdminController.adminUpdate);
router.get('/dashboard', dashboardController.dashboard);
module.exports = router;