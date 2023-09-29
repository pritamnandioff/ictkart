const express = require('express');
const checkAuth = require('../../middleware/authenticated');
const userController = require('../../controllers/user/userController');
const roleController = require('../../controllers/user/roleController');

const validationSchema = require('../../validators/user');
const validator = require('../../validators/validator');

const router = express.Router();
// /** Dashboard */ 
router.post('/add', validator(validationSchema.register, 'body'), userController.registration);
router.post('/login', userController.login);
router.post('/verify', userController.verify);
router.post('/update', userController.edit);
router.get('/detail', userController.userDetail);
router.get('/get', userController.getUser);
router.post('/forgot/password', userController.ForgotPassword);
router.post('/update/password', userController.changePassword);
router.post('/otp', userController.generateOtp);
router.post('/verify/otp', userController.verifyOtp);
router.get('/vendor/detail', userController.vendorDetail);
router.post('/seller/profile', userController.sellerProfile);
router.post('/list', userController.userList);
router.post('/vendor/list', userController.vendorList);
router.post('/update/status', userController.changeStatus);
router.post('/access/status', userController.changeAccessStatus);
router.get('/country', userController.allCountry);
router.post('/add/incart', userController.addToCart);
router.post('/get/incart', userController.getUserCart);
router.post('/cart', userController.cartList);
router.post('/remove/cart', userController.removeProduct);

router.post('/companyinfo/add', userController.addCompanyInfo);
router.post('/companyinfo/update', userController.updateCompanyInfo);

router.post('/brand-partnership/update', userController.updateBrandPartnerShip);

router.post('/regional-presence/update', userController.updateRegionalPresence);

router.post('/verification-docs/update', userController.updateVerificationDocs);
router.get('/currency', userController.allCurrency);
router.post('/team-members', userController.teamMembers);

router.post('/role/add', roleController.addRole);
router.post('/role/update', roleController.updateRole);
router.post('/role/list', roleController.roleList);
router.post('/role/dd/list', roleController.roleDropdownList);

module.exports = router;