const express = require("express");
const router = express.Router();

const AuthController = require("../app/controllers/AuthController");
const APIConfig = require("../util/APIConfig");

// Authentications
router.post(APIConfig.SIGNUP, AuthController.signUp);
router.post(APIConfig.GET_USER_INFO, AuthController.getUserInfo);
router.post(APIConfig.SEARCH_USER_EMAIL, AuthController.signUp);
router.get(APIConfig.GET_ALL_USER_EMAIL, AuthController.getAllUserEmail);

module.exports = router;
