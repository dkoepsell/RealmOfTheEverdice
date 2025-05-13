// Fix admin roles inconsistency
// This script updates references to user roles across the admin dashboard system
// to ensure consistent handling of admin vs superuser roles.

const fs = require('fs');
const path = require('path');

// Files to update
const FILES = [
  'client/src/hooks/use-auth.tsx',
  'client/src/hooks/use-admin.tsx',
  'client/src/pages/admin-dashboard.tsx'
];

// Main function
async function fixAdminRoles() {
  console.log('Fixing admin role inconsistencies...');
  
  // Process each file
  for (const filePath of FILES) {
    console.log(`Processing ${filePath}...`);
    
    // Read file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Update role references
    const updatedContent = content
      // Fix role checks in use-auth.tsx
      .replace(
        /isAdmin: user\.role === ['"]admin['"] \|\| user\.role === ['"]superadmin['"]/g, 
        "isAdmin: user.role === 'admin' || user.role === 'superuser'"
      )
      .replace(
        /isSuperAdmin: user\.role === ['"]superadmin['"]/g, 
        "isSuperAdmin: user.role === 'superuser'"
      )
      
      // Fix direct role checks in admin-dashboard.tsx
      .replace(
        /user\.role !== ['"]admin['"] && isSuperAdmin/g,
        "user.role !== 'admin' && user.role !== 'superuser' && isSuperAdmin"
      )
      
      // Fix other role checks
      .replace(/user\.role === ['"]superadmin['"]/g, "user.role === 'superuser'")
      .replace(/role === ['"]superadmin['"]/g, "role === 'superuser'");
    
    // Write updated content if changed
    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`Updated ${filePath}`);
    } else {
      console.log(`No changes needed for ${filePath}`);
    }
  }
  
  console.log('Completed role consistency fixes.');
}

// Run the function
fixAdminRoles().catch(err => {
  console.error('Error fixing admin roles:', err);
  process.exit(1);
});