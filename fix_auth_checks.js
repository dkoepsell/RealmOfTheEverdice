// Fix authentication checks in admin dashboard
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const adminDashboardPath = 'client/src/pages/admin-dashboard.tsx';

try {
  // Read the file
  const content = readFileSync(adminDashboardPath, 'utf8');
  
  // Apply the fixes
  let updatedContent = content;
  
  // Fix the direct role references
  updatedContent = updatedContent.replace(
    /user\.role !== "admin" && isSuperAdmin/g,
    "isSuperAdmin"
  );
  
  // Write the updated content
  writeFileSync(adminDashboardPath, updatedContent, 'utf8');
  
  console.log('Successfully fixed auth checks in admin dashboard.');
} catch (error) {
  console.error('Error fixing auth checks:', error);
  process.exit(1);
}