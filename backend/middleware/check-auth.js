const jwt = require("jsonwebtoken");
const HttpError = require("../models/http-error");

module.exports = (req, res, next) => {
  if (req.method === "OPTIONS") { // The browser first sends an OPTIONS request before POST to ensure you accept these headers. So we must handle that request.
    return next();
  }

  try {
    const token = req.headers.authorization.split(" ")[1]; // Header will read Authorization: "Bearer TOKEN" Here we use split to access the "TOKEN" string within the header.
    if (!token) {
      throw new Error("Authentication failed.");
    }

    const decodedToken = jwt.verify(token, process.env.JWT_KEY); // Must be the same private key from users-controller (set upon signup and login).
    // The decodedToken contains the userId, email, and token created by jwt during signup and login.
    // This checks that the token could have been created using this private key.
    req.userData = {
      userId: decodedToken.userId,
    }; // Add this .userData data to the request and then next() to continue to the next route that you hit in places-routes
    next(); // Go to next route.
  } catch (err) {
    const error = new HttpError("Authentication failed.", 403);
    return next(error);
  }
};
