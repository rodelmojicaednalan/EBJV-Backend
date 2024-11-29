module.exports = function errorHandler(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
};

module.exports = function verifyUser(req, res, next) {
    console.log('Verified')
    next();
 }