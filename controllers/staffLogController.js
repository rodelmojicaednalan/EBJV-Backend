'use strict';
const { staff_logs, users, roles } = require('../models'); 

const getAllStaffLogs = async (req, res) => {
  try {
    const staffLogs = await staff_logs.findAll({
      include: [
        { model: users, attributes: ['first_name', 'sex', 'last_name'],
          include:[
            {
              model:roles,
              attributes:['role_name']
            },
          ]
         },
      ], 
      order: [['createdAt', 'DESC']], 
    });
    res.status(200).json(staffLogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

  const deleteStaffLog = async (req, res) => {
    const { id } = req.params;
    try{
      await staff_logs.destroy({ where: { id } });
    res.status(200).send({ message: 'Log deleted successfully' });
    } catch (error) {
      res.status(500).send({ error: 'Failed to delete log' });
  }
  };

  const massDeleteLogs = async (req,res) => {
    const { ids } = req.body;
    try{
      await staff_logs.destroy({ where: { id: ids } });
    res.status(200).send({ message: 'Selected logs deleted successfully' });
  } catch (error) {
    res.status(500).send({ error: 'Failed to delete selected logs' });
  }
  };

module.exports = {
  getAllStaffLogs,
  deleteStaffLog,
  massDeleteLogs
};