// If you use Express in more than one file, you must still import it in all of the associated files.
const express = require("express");
const { check } = require("express-validator");

const placesController = require("../controllers/places-controller");
const fileUpload = require("../middleware/file-upload");
const checkAuth = require('../middleware/check-auth');

const HttpError = require("../models/http-error");

const router = express.Router();

router.get("/:pid", placesController.getPlaceById); // /api/places/id route

router.get("/user/:uid", placesController.getPlacesByUserId); // /api/places/user/id route

// Because routes are executed in order top to bottom in our code, we can check here if there is no token or an invalid token, thus blocking the user from
// the authorized routes below, if they are not authorized with the correct token.
router.use(checkAuth); // Pass a pointer to our check-auth function

router.post(
  "/",
  fileUpload.single('image'), // Looks for a POST body key named "image"
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(), // use express-validator npm package and its check() method to "chain" condition methods to validate the request body then access validationResults in places-controller file.
  ],
  placesController.createPlace
); // POST route to create new place -- should be validated

router.patch(
  "/:pid",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  placesController.updatePlace
); // Update an existing place -- should be validated

router.delete("/:pid", placesController.deletePlace); // Delete an existing place

module.exports = router;
