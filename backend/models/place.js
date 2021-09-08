// Define Schema
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

// The "blueprint" of our new Documents in the places collection.
const placeSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  location: {
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
  },
  creator: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: 'User' // here we reference the User Model
  }
});
// Automatically specifies the collection to be this name but lowercase and pluralized.
// Here we specify the COLLECTION name as places (Place lowercase and pluralized).
module.exports = mongoose.model("Place", placeSchema);
