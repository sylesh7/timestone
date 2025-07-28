import TimeCapsuleService from './src/services/timeCapsuleService.js';
import KyberEncryptionService from './src/services/kyberEncryption.js';

console.log('🔐 Testing Private Key Handling\n');

async function testPrivateKeyFlow() {
  const timeCapsuleService = new TimeCapsuleService();
  const encryptionService = new KyberEncryptionService();
  
  console.log('1. Testing Key Generation...');
  
  // Generate a key pair
  const keyPair = encryptionService.generateKeyPair();
  console.log('   ✅ Key pair generated');
  console.log(`   📊 Algorithm: ${keyPair.algorithm}`);
  
  // Test data
  const testData = 'Hello, this is a test message for private key validation!';
  console.log(`   📝 Test data: "${testData}"`);
  
  // Encrypt with public key
  const encrypted = encryptionService.encrypt(testData, keyPair.publicKey);
  console.log('   ✅ Data encrypted');
  
  // Decrypt with private key
  const decrypted = encryptionService.decrypt(encrypted, keyPair.privateKey);
  console.log('   ✅ Data decrypted');
  console.log(`   📝 Decrypted: "${decrypted.toString()}"`);
  
  const matches = testData === decrypted.toString();
  console.log(`   ${matches ? '✅' : '❌'} Encryption/Decryption: ${matches ? 'SUCCESS' : 'FAILED'}\n`);
  
  if (!matches) {
    console.error('❌ Basic encryption test failed! This indicates a fundamental issue.');
    return false;
  }
  
  console.log('2. Testing File Encryption...');
  
  // Test file encryption
  const fileBuffer = Buffer.from('This is test file content with some binary data: ' + '\x00\x01\x02\x03');
  const fileMetadata = {
    name: 'test.txt',
    type: 'text/plain',
    originalSize: fileBuffer.length
  };
  
  const encryptedFile = encryptionService.encryptFile(fileBuffer, fileMetadata, keyPair.publicKey);
  console.log('   ✅ File encrypted');
  
  const decryptedFile = encryptionService.decryptFile(encryptedFile, keyPair.privateKey);
  console.log('   ✅ File decrypted');
  
  const fileMatches = Buffer.compare(fileBuffer, decryptedFile.fileBuffer) === 0;
  console.log(`   ${fileMatches ? '✅' : '❌'} File Encryption/Decryption: ${fileMatches ? 'SUCCESS' : 'FAILED'}\n`);
  
  if (!fileMatches) {
    console.error('❌ File encryption test failed!');
    return false;
  }
  
  console.log('3. Testing Time Capsule Creation...');
  
  // Create a time capsule with immediate unlock for testing
  const unlockTime = new Date(Date.now() + 1000); // 1 second from now
  
  try {
    const result = await timeCapsuleService.createTimeCapsule({
      fileBuffer,
      fileName: 'test-private-key.txt',
      fileType: 'text/plain',
      unlockTimestamp: unlockTime.toISOString(),
      recipientAddress: '0x1234567890abcdef1234567890abcdef12345678',
      creatorAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
      message: 'Test capsule for private key validation'
    });
    
    console.log('   ✅ Time capsule created');
    console.log(`   🆔 Capsule ID: ${result.capsule.id}`);
    
    // Show the private keys for comparison
    console.log('\n🔍 Key Comparison:');
    console.log('Original Private Key (from key generation):');
    console.log(JSON.stringify(keyPair.privateKey, null, 2));
    
    console.log('\nCapsule Private Key (from capsule creation):');
    console.log(JSON.stringify(result.privateKey, null, 2));
    
    const keysMatch = JSON.stringify(keyPair.privateKey) === JSON.stringify(result.privateKey);
    console.log(`\n${keysMatch ? '⚠️' : '✅'} Keys are ${keysMatch ? 'SAME (unexpected)' : 'DIFFERENT (expected)'}`);
    
    // Wait for unlock time
    console.log('\n4. Testing Unlock Process...');
    console.log('   ⏳ Waiting for unlock time...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to unlock with the CORRECT private key
    const unlocked = await timeCapsuleService.unlockTimeCapsule(
      result.capsule.id,
      result.privateKey, // Use the private key from capsule creation
      '0x1234567890abcdef1234567890abcdef12345678'
    );
    
    console.log('   ✅ Capsule unlocked successfully');
    console.log(`   📄 Content: ${unlocked.content.fileBuffer.toString()}`);
    
    const unlockMatches = unlocked.content.fileBuffer.toString() === fileBuffer.toString();
    console.log(`   ${unlockMatches ? '✅' : '❌'} Content matches: ${unlockMatches ? 'SUCCESS' : 'FAILED'}\n`);
    
    // Show what the frontend should save
    console.log('💡 Frontend Implementation Guide:');
    console.log('==================================');
    console.log('When creating a capsule:');
    console.log('1. Call createTimeCapsule API');
    console.log('2. Save the returned privateKey with the capsuleId');
    console.log('3. Each capsule has a UNIQUE private key');
    console.log('4. Store in localStorage like:');
    console.log(`   localStorage.setItem('capsule_${result.capsule.id}', JSON.stringify(result.privateKey));`);
    console.log('');
    console.log('When unlocking a capsule:');
    console.log('1. Get the capsuleId from the URL or input');
    console.log('2. Retrieve the private key:');
    console.log(`   const privateKey = JSON.parse(localStorage.getItem('capsule_${result.capsule.id}'));`);
    console.log('3. Call unlockTimeCapsule with the specific private key');
    
    return true;
    
  } catch (error) {
    console.error('❌ Time capsule test failed:', error.message);
    return false;
  }
}

// Run the test
testPrivateKeyFlow()
  .then((success) => {
    if (success) {
      console.log('\n🎉 All private key tests passed!');
      console.log('The backend is working correctly. The issue is likely in frontend key management.');
    } else {
      console.log('\n💥 Private key tests failed!');
      console.log('There is an issue with the backend encryption.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n💥 Test crashed:', error);
    process.exit(1);
  });
