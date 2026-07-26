/**
 * Centralized Error Handling Middleware for KFC Server
 */
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    code: 'NOT_FOUND',
  });
};

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'An unexpected server error occurred';
  let code = 'SERVER_ERROR';
  let errors = undefined;

  // 1. Mongoose CastError (Bad ObjectId format)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ID format for ${err.path}`;
    code = 'VALIDATION_ERROR';
  }

  // 2. Mongoose ValidationError
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    errors = {};
    Object.keys(err.errors || {}).forEach((key) => {
      errors[key] = err.errors[key].message;
    });
  }

  // 3. Mongoose Duplicate Key Error (code 11000)
  else if (err.code === 11000) {
    statusCode = 409;
    code = 'CONFLICT';
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `This ${field} is already in use`;
  }

  // 4. JWT Errors
  else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'UNAUTHORIZED';
    message = err.name === 'TokenExpiredError' ? 'Session expired, please log in again' : 'Invalid authentication token';
  }

  // Map HTTP Status Code to Error Code string if generic
  if (code === 'SERVER_ERROR') {
    if (statusCode === 400) code = 'VALIDATION_ERROR';
    else if (statusCode === 401) code = 'UNAUTHORIZED';
    else if (statusCode === 403) code = 'FORBIDDEN';
    else if (statusCode === 404) code = 'NOT_FOUND';
    else if (statusCode === 409) code = 'CONFLICT';
  }

  // Debug logging server-side
  const userIdStr = req.user ? ` (User: ${req.user._id})` : '';
  console.error(`[ERROR] [${req.method}] ${req.originalUrl}${userIdStr} - ${statusCode} [${code}]: ${err.message}`);
  if (statusCode === 500 && err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    code,
    ...(errors ? { errors } : {}),
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};

module.exports = { notFound, errorHandler };
