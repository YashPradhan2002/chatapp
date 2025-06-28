const crypto = require('crypto');

// Encryption configuration
const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32; // 256 bits

/**
 * Generate a random encryption key for a room
 */
const generateRoomKey = () => {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
};

/**
 * Derive a key from the room's encryption key and a salt
 */
const deriveKey = (roomKey, salt) => {
  return crypto.pbkdf2Sync(roomKey, salt, 100000, KEY_LENGTH, 'sha512');
};

/**
 * Encrypt a message
 */
const encryptMessage = (text, roomKey) => {
  try {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = deriveKey(roomKey, salt);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Combine salt, iv, and encrypted data
    const combined = Buffer.concat([
      salt,
      iv,
      Buffer.from(encrypted, 'hex')
    ]);
    
    return combined.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt message');
  }
};

/**
 * Decrypt a message
 */
const decryptMessage = (encryptedData, roomKey) => {
  try {
    const combined = Buffer.from(encryptedData, 'base64');
    
    // Extract components
    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH);
    
    const key = deriveKey(roomKey, salt);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    let decrypted = decipher.update(encrypted, null, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt message');
  }
};

/**
 * Generate a unique invite code
 */
const generateInviteCode = () => {
  return crypto.randomBytes(16).toString('hex').toUpperCase();
};

/**
 * Hash room password
 */
const hashRoomPassword = async (password) => {
  const bcrypt = require('bcryptjs');
  return await bcrypt.hash(password, 12);
};

/**
 * Verify room password
 */
const verifyRoomPassword = async (password, hashedPassword) => {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(password, hashedPassword);
};

module.exports = {
  generateRoomKey,
  encryptMessage,
  decryptMessage,
  generateInviteCode,
  hashRoomPassword,
  verifyRoomPassword
};
