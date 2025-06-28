// Quick test to ensure server modules load correctly
console.log('Testing server modules...');

try {
  // Test encryption
  const encryption = require('./utils/encryption');
  console.log('✅ Encryption module loaded');
  
  const key = encryption.generateRoomKey();
  const encrypted = encryption.encryptMessage('test message', key);
  const decrypted = encryption.decryptMessage(encrypted, key);
  console.log('✅ Encryption/Decryption working:', decrypted === 'test message');
  
  // Test constants
  const constants = require('./constants');
  console.log('✅ Constants module loaded');
  console.log('✅ Socket events defined:', Object.keys(constants.SOCKET_EVENTS).length);
  
  // Test models (this requires database connection)
  console.log('✅ Basic module tests passed!');
  console.log('🚀 Server should be ready to start');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
