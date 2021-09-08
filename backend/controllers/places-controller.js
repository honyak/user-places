const fs = require("fs");

const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator"); // this require is placed in the file where you need to check the validation results from the places-routes
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");
const getCoordsForAddress = require("../util/location");
const Place = require("../models/place");
const User = require("../models/user");

const AWS = require("aws-sdk");

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.REGION,
});

const s3 = new AWS.S3();

// GET .../api/places/:pid
const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;

  // must define place before our try block so it can be caught with our if(!place) error handling condition below.
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      `Something went wrong, could not find a place with the place id: ${placeId}`,
      500
    );
    return next(error);
  }
  if (!place) {
    const error = new HttpError(
      "Could not find a place for the provided place id.",
      404
    );
    return next(error);
  }
  res.json({ place: place.toObject({ getters: true }) }); // adding the getters:true property to our place object tells mongoose to retain the string property "id" from its getter.
};

// GET .../api/places/user/:uid
const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate("places"); // This gives us access to all of the 'places' documents within the userWithPlaces.places property if a matched user is found with findById().
  } catch (err) {
    const error = new HttpError(
      `Something went wrong, could not find any places with the user id provided: ${userId}`,
      500
    );
    return next(error);
  }

  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    // IF no places are returned upon searching req.params.uid in place.creator
    return next(
      new HttpError(
        `Could not find any places for the provided user id: ${userId}`,
        404
      )
    );
  }
  res.json({
    places: userWithPlaces.places.map((place) =>
      place.toObject({ getters: true })
    ), // getters:true gives us access to the string type property "id" instead of the default _id object type property
  });
};
// POST .../api/places/
const createPlace = async (req, res, next) => {
  const errors = validationResult(req); // Handle any errors in our POST body data first.
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError("Invalid inputs provided, please check your data.", 422)
    );
  }
  const { title, description, address } = req.body;

  let coordinates; // Since our getCoordsForAddress function COULD throw an error, we should try the code then catch the error
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error); // Here, we do not want to throw an error, but simply exit the code execution by returning then using the next(error) method to forward the error.
  }

  // creating a new instance of model based on the Place model and its Schema specified in the models/place file.
  // When we specify this mongoose model, we are specifying the name of the COLLECTION to be written within our database, inside the models/place.
  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: req.file.key, // npm package 'multer' places the image object into req.file property.
    creator: req.userData.userId, // this property is set in check-auth when a user is logged in. So the creator is set to the user logged in, not from the request body.
  });
  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError("Create place failed.", 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided ID.", 404);
    return next(error);
  }

  try {
    // This opens a session that stores two save method executions and commits the transaction containing both executions only if everything runs successfully.
    // WHEN WE ARE WORKING WITH SESSIONS & TRANSACTIONS: MONGODB ***WILL NOT*** CREATE THE NEW COLLECTION ON THE FLY. YOU MUST CREATE IT FIRST.
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Creating place failed, please try again.",
      500
    );
    return next(error);
  }
  res.status(201).json({ place: createdPlace });
};

// PATCH .../api/places/:pid  Update
const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError("Invalid inputs provided, please check your data.", 422)
    );
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  // Here we run mongoose findById to IDENTIFY the correct place to update and store it in place.
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update place ",
      500
    );
    return next(error);
  }

  if (place.creator.toString() !== req.userData.userId) {
    const error = new HttpError(
      "You do not have permission to edit this place.",
      401
    );
    return next(error);
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update place.",
      500
    );
    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

// DELETE .../api/places/:pid
const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId).populate("creator");
    // Since we have the "ref" properties declared in both place and user model, we can call populate('reference property')
    // populate() allows you to access all of the referenced documents within the reference property specified. IE this is why we can access place.creator.places below.
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete a place.",
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError("Could not find place for this id.", 404);
    return next(error);
  }

  // place.creator contains the entire mongoose database object from the populate() method above. It includes the id property from getters:true.
  if (place.creator.id !== req.userData.userId) {
    const error = new HttpError(
      "You do not have permission to delete this place.",
      401
    );
    return next(error);
  }

  const imagePath = place.image;

  try {
    const sess = await mongoose.startSession(); // here we begin a Session and only commit the actions when we commitTransaction().
    sess.startTransaction();
    await place.remove({ session: sess });
    place.creator.places.pull(place); // pull() automatically removes the id
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete the identified place.",
      500
    );
    return next(error);
  }
  // console.log(place);
s3.deleteObject({
  Bucket: 'user-places-images',
  Key: place.image
}, (err, data) => {
  if (err) console.log(err, err.stack);
  else console.log('Delete Action Successful!');
})

  // fs.unlink(imagePath, (err) => {
  //   console.log(err);
  // });

  res.status(200).json({ message: `Deleted place with id: ${placeId}` });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
