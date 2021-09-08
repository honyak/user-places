const axios = require("axios");
const HttpError = require("../models/http-error");
require('dotenv').config({path: '.env.local'});

const API_KEY = process.env.REACT_APP_googleAPI;
// Google API key located in .env file

const getCoordsForAddress = async (address) => {
  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${API_KEY}`
  );

  const data = response.data;

  if (!data || data.status === "ZERO_RESULTS") {
    const error = new HttpError(
      "Could not find location for the provided address.",
      422
    );
    throw error;
  }
  const coordinates = data.results[0].geometry.location;

  return coordinates;
};
module.exports = getCoordsForAddress;
