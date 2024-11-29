const {users_roles} = require('../models');

const getUserRoles = async (req, res) => {
    try {
      const userRoles = await users_roles.findAll({
        order: [['user_id', 'ASC'], ['role_id', 'ASC']]
      });
      res.status(200).json(userRoles);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

const deleteUserRole = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
      const deleted = await users_roles.destroy({ where: { id } });
      if (deleted) {
          res.status(200).json({ message: 'User Role deleted successfully' });
      } else {
          res.status(404).json({ error: 'User Role not found' });
      }
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
};

  module.exports = {
    getUserRoles,
    deleteUserRole
  };
  
  