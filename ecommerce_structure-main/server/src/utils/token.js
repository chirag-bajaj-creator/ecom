const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');
const RefreshToken = require('../models/RefreshToken');

const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRY }
  );
};

const generateRefreshToken = async (user) => {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await RefreshToken.create({
    userId: user._id,
    token,
    expiresAt,
  });

  return token;
};

const verifyRefreshToken = async (token) => {
  const refreshToken = await RefreshToken.findOne({ token });

  if (!refreshToken) return null;
  if (refreshToken.expiresAt < new Date()) {
    await RefreshToken.deleteOne({ _id: refreshToken._id });
    return null;
  }

  return refreshToken;
};

const deleteRefreshToken = async (token) => {
  await RefreshToken.deleteOne({ token });
};

const deleteAllUserRefreshTokens = async (userId) => {
  await RefreshToken.deleteMany({ userId });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  deleteRefreshToken,
  deleteAllUserRefreshTokens,
};
