const {role_permissions} = require('../models');

const getRolePermission = async (req, res) => {
    try {
      const rolePermission = await role_permissions.findAll({
        order: [['role_id', 'ASC'], ['permission_id', 'ASC']]
      });
      res.status(200).json(rolePermission);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
   
  const getRolePermissionById = async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const rolePermission = await role_permissions.findByPk(id);
        if (rolePermission) {
            res.status(200).json(rolePermission);
        } else {
            res.status(404).json({ error: 'Role Permission not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

  const createRolePermission = async (req, res) => {
    const { role_id, permission_id } = req.body;
    try {
        const newRolePermission = await role_permissions.create({ role_id, permission_id });
        res.status(201).json({ message: `Role ${newRolePermission.role_id} assigned with Permission ${newRolePermission.permission_id} successfully` });
    } catch (error) {
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            res.status(400).json({ error: 'Invalid role_id or permission_id provided.' });
        } else if (error.name === 'SequelizeUniqueConstraintError') {
            res.status(400).json({ error: 'This Role-Permission combination already exists.' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
};


const updateRolePermission = async (req, res) => {
  const { role_id, permissions } = req.body;

  try {
    // Get current permissions for the role
    const currentPermissions = await role_permissions.findAll({ where: { role_id } });
    const currentPermissionIds = currentPermissions.map(p => p.permission_id);

    // Determine which permissions to add
    const permissionsToAdd = permissions.filter(p => !currentPermissionIds.includes(p));
    const permissionsToRemove = currentPermissionIds.filter(p => !permissions.includes(p));

    // Add new permissions
    if (permissionsToAdd.length > 0) {
      const rolePermissionsToAdd = permissionsToAdd.map(permissionId => ({
        role_id,
        permission_id: permissionId
      }));
      await role_permissions.bulkCreate(rolePermissionsToAdd);
    }

    // Remove old permissions
    if (permissionsToRemove.length > 0) {
      await role_permissions.destroy({
        where: {
          role_id,
          permission_id: permissionsToRemove
        }
      });
    }

    res.status(200).json({ message: 'Role permissions updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


  
const deleteRolePermission = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
      const deleted = await role_permissions.destroy({ where: { id } });
      if (deleted) {
          res.status(200).json({ message: 'Role Permission deleted successfully' });
      } else {
          res.status(404).json({ error: 'Role Permission not found' });
      }
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
};

  module.exports = {
    getRolePermission,
    getRolePermissionById,
    createRolePermission,
    updateRolePermission,
    deleteRolePermission
  };
  