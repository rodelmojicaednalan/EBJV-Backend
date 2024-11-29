const {users} = require('../models');
const jwt = require('jsonwebtoken');
const {findByApiKey} = require('./authAPI');
const JWT_SECRET = process.env.JWT_SECRET;
require('dotenv').config();


// middleware for doing role-based permissions
module.exports = async function authorize(request, res, next) {
    const authHeader = request.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    if (request.path === '/login' || request.path === '/reset-password' || request.path === '/confirm-reset-password' || request.path === '/refresh') {
        return next(); // Skip token verification for login/register routes
    }

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
try{
    const decoded = jwt.verify(token, JWT_SECRET);
    request.user = await findByApiKey(decoded.id);
    if(!request.user) {
        return res.status(401).json({error: 'Unknown user'});
    }
    next();
}catch (error){
    console.error('JWT Verification Error:', error);
   return res.status(403).json({error: 'Invalid Token'});
}
}
