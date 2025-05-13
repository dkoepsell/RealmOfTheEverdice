// Script to reset KoeppyLoco's password
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function resetKoeppyLocoPassword() {
  const hashedPassword = await hashPassword('admin123');
  console.log('Hashed password:', hashedPassword);
  
  await db.update(users)
    .set({ password: hashedPassword })
    .where(eq(users.username, 'KoeppyLoco'))
    .execute();
    
  console.log('KoeppyLoco password has been reset to "admin123"');
}

resetKoeppyLocoPassword().catch(error => {
  console.error('Error resetting password:', error);
  process.exit(1);
});