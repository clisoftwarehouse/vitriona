import bcrypt from 'bcryptjs';

export const hashPassword = (password: string): Promise<string> => bcrypt.hash(password, 10);

export const verifyPassword = (storedHash: string, password: string): Promise<boolean> =>
  bcrypt.compare(password, storedHash);
