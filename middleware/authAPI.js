
const { users, roles, permissions } = require('../models');

async function findByApiKey(id) {
    try {
        const user = await users.findOne({
            include: [{
                model: roles,
                include: [{
                    model: permissions
                }]
            }],
            where: { id: id }
        });

        if (!user) {
            throw new Error('User not found');
        }
        return user;
    } catch (err) {
        console.error('Error in findByApiKey:', err.message);
    }
}

module.exports = { findByApiKey };
