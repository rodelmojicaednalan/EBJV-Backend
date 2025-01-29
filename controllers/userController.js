const {users, staff_logs, roles, users_roles, permissions, reset_passwords, projects} = require('../models');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { setTokens, clearTokens } = require('../utils/tokenUtils');
const JWT_SECRET = process.env.JWT_SECRET;
require('dotenv').config();
const { sendEmail } = require('../utils/emailService');

const getUsers = async (req, res) => {
  try {
    const user = await users.findAll({
      order: [['id', 'ASC']],
      include: [
        {
          model: roles,
          attributes: ['role_name']
        },
        {
          model: projects,
          as: 'ownedProjects',
          attributes: ['id', 'project_name']
        },
      ],
      attributes: ['id', 'first_name', 'last_name', 'employer', 'username', 'email']
    });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserById = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const user = await users.findByPk(id, {
      include: [
        {
          model: roles,
          attributes: ['role_name']
        },
        {
          model: projects,
          as: 'ownedProjects',
          attributes: ['id', 'project_name']
        },
 
      ],
      attributes: ['id', 'first_name', 'last_name', 'employer', 'username', 'email', 'password']
    });
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming the user ID is available in the request object

    // Fetch user with associated role and branch
    const user = await users.findByPk(userId, {
      include: [
        {
          model: projects,
          as: 'ownedProjects',
          attributes: ['id', 'project_name']
        },
        {
          model: roles,
          attributes: ['role_name', 'role_description'], 
        },
      ],
      attributes: ['id', 'first_name', 'last_name', 'employer', 'username', 'email']
    });

    if (user) {
      // Extract and format the role and permissions data
      const rolesWithPermissions = user.roles.map(role => ({
        role_name: role.role_name,
        role_description: role.role_description,
      }));

      // Prepare the response object
       const response = {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        email: user.email,
        roles: rolesWithPermissions,
        projects: user.ownedProjects.map(project => project.project_name) || []
      };

      res.status(200).json(response);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const addUser = async (req, res) => {
  const { first_name, last_name, username, email, password, role_name} = req.body;
  try {
    const newUser = await users.create({first_name, last_name, username, email, password });
   
    const role = await roles.findOne({where: {role_name}});
    if(!role){
      return res.status(400).json({error: 'Role Not Found'});
    }
    await users_roles.create({
      user_id: newUser.id,
      role_id: role.id
    });
    
    res.status(201).json({ message: 'User created successfully', user: newUser });
    await sendEmail(
      email, 
      `EBJV App ${role_name} Account Creation`,
       `
       Welcome! You have been granted an account for the EBJV App, your details are:
       Name: ${first_name} ${last_name},
       Email: ${email},
       Username: ${username},
       Password: ${password},
       Role: ${role_name}
       Please login to the EBJV App at https://evjbportal.olongapobataanzambalesads.com.
       `,
      `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EBJV Account Request</title>
    <style>
        /* Reset styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
  
        /* Base styles */
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f8fafc;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
  
        /* Container styles */
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            margin: 20px auto;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
  
        /* Header styles */
        .header {
            background-color: #eb6314;
            padding: 24px;
            text-align: center;
            color: #1e293b;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
  
        /* Content styles */
        .content {
            padding: 32px 24px;
        }
  
        .title {
            font-size: 20px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 24px;
            line-height: 1.4;
        }
  
        .detail-row {
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e2e8f0;
        }
  
        .detail-label {
            font-weight: 600;
            color: #475569;
            margin-right: 8px;
        }
  
        .detail-value {
            color: #1e293b;
        }
  
        /* Button styles */
        .button {
            display: inline-block;
            background-color: #eb6314;
            color: #ffffff;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin-top: 24px;
            text-align: center;
            transition: background-color 0.2s;
        }
  
        .button:hover {
            background-color:rgb(243, 105, 25);
        }
  
        /* Footer styles */
        .footer {
            text-align: center;
            padding: 24px;
            color: #64748b;
            font-size: 12px;
            background-color: #f8fafc;
            border-top: 1px solid #e2e8f0;
        }
  
        /* Responsive styles */
        @media only screen and (max-width: 600px) {
            .container {
                margin: 10px;
                width: auto;
            }
  
            .content {
                padding: 24px 16px;
            }
  
            .button {
                display: block;
                width: 100%;
            }
        }
    </style>
  </head>
  <body>
    <div class="container">
        <div class="header">
            EBJV ${role_name} ACCOUNT CREATION
        </div>
  
        <div class="content">
            <h1 class="title"> Welcome! You have been granted an account for the EBJV App, your details are:</h1>
            
            <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span class="detail-value">${first_name} ${last_name}</span>
            </div>
            
            <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${email}</span>
            </div>
            
            <div class="detail-row">
                <span class="detail-label">Username:</span>
                <span class="detail-value">${username}</span>
            </div>
            
            <div class="detail-row">
                <span class="detail-label">Password:</span>
                <span class="detail-value">${password}</span>
            </div>

            <div class="detail-row">
                <span class="detail-label">Role:</span>
                <span class="detail-value">${role_name}</span>
            </div>
  
            <p style="margin: 24px 0; color: #475569;">
             Visit the app through the link below to get started.
            </p>
  
            <a href="https://evjbportal.olongapobataanzambalesads.com/" class="button">
                Head to the App
            </a>
        </div>
  
        <div class="footer">
            EBJV<br>
            Australia
        </div>
    </div>
  </body>
  </html>
      `
    )
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const user = await users.findOne({ where: { username } ,
      include: [
        {
          model: roles,
          as: 'roles', 
          include: {
            model: permissions,
            as: 'permissions', 
            through: { attributes: [] } 
          }
        },
      ] 
    
    });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }   

    const accessToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '2h' });
    const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    const roleName = user.roles.some(role => role.role_name === 'Admin') ? 'Admin' : 'Client';

  
    setTokens(res, accessToken, refreshToken);
    res.cookie('role_name', roleName, { httpOnly: true, secure: true });

    
    await staff_logs.create({ user_id: user.id, action: 'login'});

    const roleAndpermission = user.roles.map(role => ({
      role_name: role.role_name,
      permission: role.permissions.map(permission => permission.permission_name)
    }));

    res.status(200).json({ 
      accessToken, 
      refreshToken,
      roleName,
      user: {
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        password: user.password,
        email: user.email,
        roles: roleAndpermission 
      },
      message: 'Logged in successfully'});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const logout = async (req, res) => {
  try{
    const user_id = req.user.id;

    clearTokens(res);

    await staff_logs.create({ user_id, action: 'logout'});
    res.status(200).json({message: 'Logged out successfully'});
  } catch(error){
    res.status(500).json({error: error.message});
  }
};

const refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.sendStatus(401);
  }
  try {
    jwt.verify(refreshToken, JWT_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      const newAccessToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '2h' });
      setTokens(res, newAccessToken, refreshToken);
      res.json({ accessToken: newAccessToken });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateUser = async (req, res) => {
  const id = parseInt(req.params.id);
  const { first_name, last_name, username, email, password, role_name} = req.body;
  try {
    const user = await users.findByPk(id);

    if (user) {
      user.first_name = first_name;
      user.last_name = last_name;
      user.username = username;
      user.email = email;
      if (password) {
        user.password = password; 
      }
      await user.save();

      if (role_name) {
        const role = await roles.findOne({ where: { role_name } });
        if (role) {
          await users_roles.update(
            { role_id: role.id },
            { where: { user_id: user.id } }
          );
        } else {
          return res.status(404).json({ error: 'Role not found' });
        }
      }
      res.status(200).json({message: 'User Updated Successfully'});
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteUser = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const deleted = await users.destroy({ where: { id } });
    if (deleted) {
      res.status(200).json({ message: `User deleted with ID: ${id}` });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateProfile = async (req, res) => {
  const { username, email, oldPassword, newPassword } = req.body;

  try {
    const userId = req.user.id;
    const user = await users.findByPk(userId);

    // Ensure the user exists
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

     if (newPassword) {
      // Only check the old password if a new password is provided
      const validPassword = await bcrypt.compare(oldPassword, user.password);
      if (!validPassword) {
        return res.status(400).json({ message: 'Old password is incorrect.' });
      }

      // Update the password directly; the hook will hash it
      user.password = newPassword;
    }

    // Update username and email if provided
    if (username) user.username = username;
    if (email) user.email = email;

    await user.save();
    res.status(200).json({ message: 'Profile updated successfully.' });
   /* await sendEmail(user.email, 'Profile Updated', `Hello ${user.first_name}, your profile has been updated successfully. 
      Username: ${username}
      Email: ${email},
      Old Password: ${oldPassword}
      New Password: ${newPassword} `);*/
      
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};


const resetPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await users.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Generate a password reset token
    const resetToken = crypto.randomBytes(3).toString('hex');
    const resetTokenExpires = Date.now() + 3600000; // Token valid for 1 hour

    // Save the token and expiration in the password_resets table
    await reset_passwords.create({
      user_id: user.id,
      token: resetToken,
      expiresAt: resetTokenExpires
    });

    // Send reset email
    const resetUrl = `https://v2.revivepharmacyportal.com.au/reset-password/${resetToken}`;
    await sendEmail(user.email, 'Password Reset Request', `Please click the following link to reset your password: ${resetUrl}`);

    res.status(200).json({ message: 'Password reset email sent.' });
  } catch (error) {
    console.error("Error sending password reset email:", error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
}; 

const confirmResetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    // Find the password reset request using the token
    const resetRequest = await reset_passwords.findOne({
      where: {
        token
      }
    });

    if (!resetRequest) {
      return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }

    const user = await users.findOne({ where: { id: resetRequest.user_id } });
    if (!user || user.id !== resetRequest.user_id) { 
      return res.status(404).json({ message: 'User not found or token does not match user.' });
    }

    user.password = newPassword;
    await user.save();

    await reset_passwords.destroy({
      where: {
        token
      }
    });
    res.status(200).json({ message: 'Password reset successfully.' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  getUsers,
  getUserById,
  getCurrentUser,
  addUser,
  refresh,
  login,
  logout,
  updateUser,
  deleteUser,
  updateProfile,
  resetPassword,
  confirmResetPassword
};