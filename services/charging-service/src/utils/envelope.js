/**
 * Standard API Response Envelope Helper
 * All microservices follow { success: boolean, data: any, message: string }
 */
function success(res, data = null, message = 'ok', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    message
  });
}

function error(res, message = 'Error', statusCode = 500, data = null) {
  return res.status(statusCode).json({
    success: false,
    data,
    message
  });
}

module.exports = {
  success,
  error
};
