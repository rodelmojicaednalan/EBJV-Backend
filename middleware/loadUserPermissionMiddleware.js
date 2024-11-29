
const { findByApiKey } = require('./authAPI');
module.exports = function loadDbPermission(request, res, next) {
    request.db = {
        users: {
            findByApiKey: async token => {
                try {
                    const user = await findByApiKey(token);
                    if (user) {
                        request.user = {
                            id: user.dataValues.id,
                            username: user.dataValues.username,
                            email: user.dataValues.email,
                            roles: user.roles.map(role => ({
                                id: role.dataValues.id,
                                name: role.dataValues.role_name,
                                permissions: role.permissions.map(permission => permission.dataValues.permission_name)
                            }))
                        };
                        return request.user;
                    } else {
                        return null;
                    }
                } catch (err) {
                    console.error("Error in findByApiKey:", err);
                    return res.sendStatus(403);
                }
            }
        }
    };
    next();
};

