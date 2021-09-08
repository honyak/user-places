// If you use Express in more than one file, you must still import it in all of the associated files.
const express = require("express");
const { check } = require("express-validator");

const usersController = require("../controllers/users-controller");
const fileUpload = require('../middleware/file-upload');

const HttpError = require("../models/http-error");

const router = express.Router();

router.get("/", usersController.getUsers);

router.post(
  "/signup",
  fileUpload.single('image'),
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(), // normalizeEmail == Test@test.com => test@test.com (lowercase) and then check isEmail() validator method.
    check("password").isLength({ min: 6 })
  ],
  usersController.signup
); // uses validators from express-validator

router.post("/login", usersController.login);

module.exports = router;
