class HttpError extends Error {
    constructor(message, errorCode) { // this runs everytime we instantiate this class 
        super(message); // Add "message" property to the Error instance.
        this.code = errorCode; // Adds "code" property to the instance
    }
}

module.exports = HttpError;