const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });

  return token;
};

const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: user,
  });
};

exports.Signup = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm, role } = req.body;
  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
    role,
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();

  createAndSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //check if email && password exists
  if (!email || !password) {
    return next(new AppError('email or password invalid', 400));
  }

  //check if user exits
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.validatePassword(password, user.password))) {
    return next(new AppError('incorrect email or password'));
  }

  //if errThing ok, send token to client
  createAndSendToken(user, 200, res);
});

exports.protectRoute = catchAsync(async (req, res, next) => {
  // 1. get token and check if it exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('you are not logged in', 401));
  }

  // 2. validate token
  const decodedPayload = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );

  // 3. check if user still exists
  const user = await User.findById(decodedPayload.id);

  if (!user) return next(new AppError('user no longer exists', 401));

  // 4. check if user changed password after jwt was issued
  if (user.changePasswordAfterJWTIssued(decodedPayload.iat)) {
    return next(
      new AppError('user changed password, please log in again'),
      401
    );
  }

  //Grant access to protected route
  req.user = user;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('User does not exists', 404));
  }
  // get random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    // send it to user email
    const resetUrl = `${req.protocol}://${req.get(
      'host'
    )}/api/v2/users/resetPassword/${resetToken}`;

    await new Email(user, resetUrl).sendResetPassword();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    (user.passwordResetToken = undefined),
      (user.passwordResetExpires = undefined),
      await user.save({ validateBeforeSave: false });
      console.log(err)

    return next(
      new AppError(
        'There was an error sending the email, pls try again later',
        401
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gte: Date.now() },
  });

  // 2) set new password if token has not expired and user exits
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) update passwordChangedAt property using an instance method

  // 4) log user in, send jwt
  createAndSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) CHECK IF POSTED password IS correct
  if (!(await user.validatePassword(req.body.currentPassword, user.password))) {
    return next(new AppError('incorrect password', 401));
  }

  // update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 3) log user in, send jwt
  createAndSendToken(user, 200, res);
});
