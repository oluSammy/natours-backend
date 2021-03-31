const AppError = require('../utils/appError');

const handleCastErrorDb = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleValidationDb = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleDuplicateDb = (err) => {
  const duplicate = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  const message = `Duplicate field value ${duplicate}, use another value`;
  return new AppError(message, 400);
};

const handleJwtErrValidationError = () =>
  new AppError('Invalid token, please login again', 401);

const handleJwtExpiredError = () =>
  new AppError('Your token has expired, login again', 401);

const sendDevErr = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    errorStack: err.stack,
  });
};

const sendProdErr = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

    //Programming or other unknown error: don't leak details
  } else {
    console.log('Error🎈', err);
    res.status(500).json({
      status: 'Error',
      message: `Something went wrong`,
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendDevErr(err, res);
  } else {
    let newError = { ...err };
    if (newError.kind === 'ObjectId') newError = handleCastErrorDb(err);
    if (newError.code === 11000) newError = handleDuplicateDb(err);
    if (newError._message === 'Validation failed')
      newError = handleValidationDb(err);
    if (newError.name === 'JsonWebTokenError')
      newError = handleJwtErrValidationError();
    if (newError.name === 'TokenExpiredError')
      newError = handleJwtExpiredError();

    sendProdErr(newError, res);
  }

  next();
};
