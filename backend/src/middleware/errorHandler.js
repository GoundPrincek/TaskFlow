class AppError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

function notFound(_req, _res, next) {
  next(new AppError(404, "Route not found."));
}

function errorHandler(error, _req, res, _next) {
  if (res.headersSent) return;
  let status = Number(error.status) || 500;
  let message = error.message;
  let errors = error.errors;

  if (error.type === "entity.parse.failed") {
    status = 400;
    message = "Request body must contain valid JSON.";
  } else if (error.type === "entity.too.large") {
    status = 413;
    message = "Request body is too large.";
  } else if (error.name === "ValidationError") {
    status = 400;
    message = "Validation failed.";
    errors = Object.values(error.errors || {}).map((item) => ({
      field: item.path,
      message: item.message,
    }));
  } else if (error.name === "CastError") {
    status = 400;
    message = "A request value has an invalid format.";
  }

  if (status >= 500) {
    message = "The server could not complete that request.";
    errors = undefined;
  }

  res.status(status).json({
    success: false,
    message: message || "The request could not be completed.",
    ...(Array.isArray(errors) && errors.length ? { errors } : {}),
  });
}

module.exports = { AppError, notFound, errorHandler };
