/**
 * A small custom Error subclass that carries an HTTP status code.
 * Controllers throw `new ApiError(404, 'Transaction not found')` and the
 * central errorHandler middleware turns it into the right response.
 */
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = ApiError;
