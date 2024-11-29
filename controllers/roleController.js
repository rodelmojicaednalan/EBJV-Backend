const {roles, permissions, role_permissions} = require('../models');

const getRoles = async (req, res) => {
    try {
      const allRoles = await roles.findAll({
        order: [['id', 'ASC']],
        include: [
          {
            model: permissions,
            through: { attributes: [] } // Exclude join table attributes
          }
        ]
      });
      res.status(200).json(allRoles);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
   const getRoleById = async (req, res) => {
    try {
      const roleId = req.params.id;
      const role = await roles.findByPk(roleId, {
        include: [
          {
            model: permissions,
            through: { attributes: [] } // Exclude join table attributes
          }
        ]
      });
  
      if (!role) {
        return res.status(404).json({ error: 'Role not found' });
      }
  
      res.json(role);
    } catch (error) {
      console.error('Error fetching role details:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  
  const createRole = async (req, res) => {
    const { role_name, role_description} = req.body;
    try {
      const newRole = await roles.create({ role_name, role_description });
      res.status(201).json({ message: `Role added with ID: ${newRole.id}` });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  const updateRole = async (req, res) => {
    const id = parseInt(req.params.id);
    const { role_name, role_description  } = req.body;
    try {
      const [updated] = await roles.update({ role_name, role_description  }, { where: { id } });
      if (updated) {
        const updatedRole = await roles.findByPk(id);
        res.status(200).json(updatedRole);
      } else {
        res.status(404).json({ error: 'Role not found' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  const deleteRole = async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      const deleted = await roles.destroy({ where: { id } });
      if (deleted) {
        res.status(200).json({ message: `Role deleted with ID: ${id}` });
      } else {
        res.status(404).json({ error: 'Role not found' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
  module.exports = {
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole
  };
  
  