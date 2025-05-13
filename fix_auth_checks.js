import fs from 'fs';

const routesFile = 'server/routes.ts';
const routesContent = fs.readFileSync(routesFile, 'utf8');

// Replace all instances of checking isAdmin and isSuperAdmin with role check
const updatedContent = routesContent
  .replace(/if \(!req\.user\.isAdmin && !req\.user\.isSuperAdmin\)/g, 
           'if (req.user.role !== "admin" && req.user.role !== "superuser")')
  .replace(/if \(!req\.user\.isSuperAdmin\)/g, 
           'if (req.user.role !== "superuser")');

fs.writeFileSync(routesFile, updatedContent);
console.log('Updated authentication checks in routes.ts');