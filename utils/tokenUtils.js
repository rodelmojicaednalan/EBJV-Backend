// utils/tokenManager.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
require('dotenv').config();

const setTokens = (res, accessToken, refreshToken) => {
    res.cookie('accessToken', accessToken, { httpOnly: true, secure: true });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true });
    

};

const clearTokens = (res) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.clearCookie('role_name');
};

const getTokens = (req) => {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;
    const userRole = req.cookies.role_name;
    return { accessToken, refreshToken, userRole };
};

const isTokenExpired = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return false; 
    } catch (error) {
        return true; 
    }
};

const getTokenExpiration = (token) => {
    try {
        const decoded = jwt.decode(token);
        return decoded.exp * 1000; 
    } catch (error) {
        return null; 
    }
};

module.exports = {
    setTokens,
    clearTokens,
    getTokens,
    isTokenExpired,
    getTokenExpiration
};
