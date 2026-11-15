import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

// Complexity requirement: >=8 characters, at least 1 number, at least 1 special symbol
const PASSWORD_REGEX = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

export function validatePasswordStrength(password: string): { isValid: boolean; reason?: string } {
  if (password.length < 8) {
    return { isValid: false, reason: 'Password must be at least 8 characters long.' };
  }
  if (!PASSWORD_REGEX.test(password)) {
    return { isValid: false, reason: 'Password must contain at least one numeral and one special character.' };
  }
  return { isValid: true };
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
