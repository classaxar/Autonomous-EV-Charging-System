const authService = require('../services/authService');
const { success, error } = require('../utils/envelope');

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const result = await authService.register({ name, email, password });
    return success(res, result, 'User registered successfully', 201);
  } catch (err) {
    if (err.status) {
      return error(res, err.message, err.status);
    }
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    return success(res, result, 'Login successful', 200);
  } catch (err) {
    if (err.status) {
      return error(res, err.message, err.status);
    }
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const userId = req.user.userId;
    const user = await authService.getProfile(userId);
    return success(res, user, 'Profile retrieved successfully', 200);
  } catch (err) {
    if (err.status) {
      return error(res, err.message, err.status);
    }
    next(err);
  }
}

module.exports = {
  register,
  login,
  getProfile
};
