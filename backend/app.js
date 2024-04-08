const fs = require("fs");
const path = require('path');
// these are node.js included modules, we do not need to manage them with npm

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/users-routes");
const HttpError = require("./models/http-error");

// We specify the DATABASE as places in the connection url
const mongo_url = process.env.REACT_APP_mongoURI;

const app = express();

app.use(bodyParser.json());

// ASSETS / IMAGES
// express.static is an included express function that serves the static file INSTEAD of executing it.
// This code declares the route at the url path /uploads/images to serve the file rather than execute, at the location of the uploads/images path.
app.use('/uploads/images', express.static(path.join('uploads', 'images')));

// SERVE UP SPA REACT APP
// This app.use catches all css and js files needed by our frontend app, but does not serve index.html when a URL path is specified (React Router doesn't work just from this, we need to serve index.html in that case)

app.use(express.static(path.join('public')));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // This allows any domain to send requests.
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  next();
});

app.use("/api/places", placesRoutes); // Only for places routes at /api/places/...
app.use("/api/users", usersRoutes);


// Any request that reaches my backend that is not handled by the api routes above... will be handled by serving index.html in public folder.
app.use((req, res, next) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});


// SINGLE SERVER DEPLOYMENT -- REMOVED CODE BELOW. This code below catches unknown requests, telling them route not found.
// This is not needed if we send ALL UNKNOWN requests to our static files (React App public files) in public folder. From npm build on frontend side.
// app.use((req, res, next) => {
//   // This only runs if we get a request which receives no other response. This is to handle a 404 Route Not Found error. Error Handling
//   const error = new HttpError("Could not find this route", 404);
//   throw error;
// });

// ** UNDONE FOR S3
// This route is for when there is an error. And if there is a file attached, it will "roll back" the file save, and execute the fs.unlink command, deleting the image in the server file system.
// app.use((err, req, res, next) => {
//   if (req.file) {
//     // the npm package multer sets the .file property to the request data. This will handle the errors with image data.
//     fs.unlink(req.file.path, (err) => {
//       console.log(err);
//     });
//   }
//   // When you provide app.use with FOUR arguments, it is treated as a special error handling middleware function.
//   // This function will execute when a request has an error "attached" or an error is thrown.
//   if (res.headerSent) {
//     // check if headerSent is true to see if a response has already been sent.
//     return next(err);
//   }
//   res
//     .status(err.code || 500)
//     .json({ message: err.message || "An uknown error occurred." });
// });


mongoose.connect(mongo_url).then(() => {
  console.log("Connected to database!");
}).catch((err) => {
  console.error("Connection error:", err);
});
