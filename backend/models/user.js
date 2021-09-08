const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

// The "blueprint" of our new Documents in the users collection.
const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // we specify unique:true here to speed up lookup times
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  image: {
    type: String,
    required: true,
  },
  // Here we specify which place IDs are associated with this user. This will be dynamic
  places: [{ // Note we put this property in an array to tell Mongoose that it will have an array value.
    type: mongoose.Types.ObjectId,
    required: true,
    ref: 'Place' // here we reference the Place Model
  }],
});

// This npm package use is what checks if the user already exists.
userSchema.plugin(uniqueValidator);

// Automatically specifies the collection to be this name but lowercase and pluralized.
// Here we specify the COLLECTION name as users
module.exports = mongoose.model("User", userSchema);
