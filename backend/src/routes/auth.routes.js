const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/user/register',    authController.registerUser);
router.post('/partner/register', authController.registerFoodPartner);

// Same controller, role auto-detected from the URL
router.post('/user/login',    authController.login);
router.post('/partner/login', authController.login);

// Single logout — works for both roles
router.post('/logout', authController.logout);

module.exports = router;