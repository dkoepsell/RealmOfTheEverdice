import { exec } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const migrationName = process.argv[2];

if (!migrationName) {
  console.error('Please provide a migration name');
  process.exit(1);
}

const migrationPath = path.join('migrations', `${migrationName}.js`);

// Check if the migration file exists
try {
  await fs.access(migrationPath);
} catch (error) {
  console.error(`Migration file ${migrationPath} does not exist`);
  process.exit(1);
}

// Run the migration using tsx
const command = `npx tsx ${migrationPath}`;
console.log(`Running migration: ${command}`);

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  
  console.log(stdout);
});