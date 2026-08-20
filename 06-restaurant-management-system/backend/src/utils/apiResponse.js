/**
 * Shape every successful API response consistently:
 * { success: true, data, message }
 */
const sendSuccess = (res, statusCode, data, message = 'Success') => {
  return res.status(statusCode).json({ success: true, message, data });
};

module.exports = { sendSuccess };
