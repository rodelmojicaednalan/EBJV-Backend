const permit = (permittedRoles = [], permittedPermissions = []) => {
  return (req, res, next) => {
      const user = req.user; 

      if (!user) {
          return res.status(401).json({ error: 'Unauthorized' });
      }

      const userRoles = user.roles.map(role => role.role_name);
      const userPermissions = user.roles.flatMap(role => role.permissions.map(permissions => permissions.permission_name));

      const hasRole = permittedRoles.length === 0 || permittedRoles.some(role => userRoles.includes(role));
      
      const hasPermission = permittedPermissions.length === 0 || permittedPermissions.some(permissions => userPermissions.includes(permissions));

      if (hasRole && hasPermission) {
          return next(); 
      }

      return res.status(403).json({ error: 'Forbidden', userRoles, hasRole, userPermissions, hasPermission });
  };
};

module.exports = permit;