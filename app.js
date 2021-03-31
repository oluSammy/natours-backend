const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./Routes/tourRoutes');
const userRouter = require('./Routes/userRoutes');
const reviewRouter = require('./Routes/reviewRoutes');
const viewRouter = require('./Routes/viewRoutes');
const bookingRouter = require('./Routes/bookingRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) Global MIDDLEWARES

// serving static files
app.use(express.static(path.join(__dirname, 'public')));

// body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// Data sanitization against no sql query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// prevents parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// set security http headers
app.use(helmet());

// development logging,
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// limit api request coming from one IP
const limiter = rateLimit({
  max: 200,
  windowMs: 60 * 60 * 1000,
  message: 'too many requests from this IP, try again in an hour',
});
app.use('/api', limiter);

// test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});

// ROUTE HANDLERS

//ROUTES

app.use('/', viewRouter);
app.use('/api/v2/tours', tourRouter);
app.use('/api/v2/users', userRouter);
app.use('/api/v2/reviews', reviewRouter);
app.use('/api/v2/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
