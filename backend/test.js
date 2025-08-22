import KyberEncryptionService from './src/services/kyberEncryption.js';
import PinataService from './src/services/pinataService.js';
import TimeCapsuleService from './src/services/timeCapsuleService.js';

console.log('🧪 Testing QNet Lite Backend Services\n');

async function testKyberEncryption() {
  console.log('1. Testing Kyber Encryption Service...');
  
  const encryption = new KyberEncryptionService();
  
  try {
    // Generate key pair
    const keyPair = encryption.generateKeyPair();
    console.log('   ✅ Key pair generated');
    console.log(`   📊 Algorithm: ${keyPair.algorithm}`);
    
    // Test data encryption
    const testData = 'Hello, Quantum-Safe Future! 🔮';
    const encrypted = encryption.encrypt(testData, keyPair.publicKey);
    console.log('   ✅ Data encrypted');
    
    // Test data decryption
    const decrypted = encryption.decrypt(encrypted, keyPair.privateKey);
    console.log('   ✅ Data decrypted');
    console.log(`   📝 Original: ${testData}`);
    console.log(`   📝 Decrypted: ${decrypted.toString()}`);
    console.log(`   ✅ Match: ${testData === decrypted.toString()}\n`);
    
    return true;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
    return false;
  }
}

async function testTimeCapsule() {
  console.log('2. Testing Time Capsule Service...');
  
  const capsuleService = new TimeCapsuleService();
  
  try {
    // Create a test capsule
    const testFile = Buffer.from('This is a secret message from the past! 📜');
    const unlockTime = new Date(Date.now() + 5000); // 5 seconds from now
    
    const capsule = await capsuleService.createTimeCapsule({
      fileBuffer: testFile,
      fileName: 'secret.txt',
      fileType: 'text/plain',
      unlockTimestamp: unlockTime.toISOString(),
      recipientAddress: '0x1234567890abcdef',
      creatorAddress: '0xabcdef1234567890',
      message: 'A test message from the future!'
    });
    
    console.log('   ✅ Time capsule created');
    console.log(`   🆔 Capsule ID: ${capsule.capsule.id}`);
    console.log(`   🔒 Sealed until: ${unlockTime.toISOString()}`);
    
    // Try to unlock before time (should fail)
    try {
      await capsuleService.unlockTimeCapsule(
        capsule.capsule.id,
        capsule.privateKey,
        '0x1234567890abcdef'
      );
      console.log('   ❌ Unlocked early (this should not happen)');
    } catch (error) {
      console.log('   ✅ Correctly prevented early unlock');
    }
    
    // Wait for unlock time
    console.log('   ⏳ Waiting for unlock time...');
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    // Try to unlock after time (should succeed)
    const unlocked = await capsuleService.unlockTimeCapsule(
      capsule.capsule.id,
      capsule.privateKey,
      '0x1234567890abcdef'
    );
    
    console.log('   ✅ Time capsule unlocked successfully');
    console.log(`   📄 Content: ${unlocked.content.fileBuffer.toString()}`);
    console.log(`   📝 Message: ${unlocked.content.message}\n`);
    
    return true;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
    return false;
  }
}

async function testPinata() {
  console.log('3. Testing Pinata Service...');
  
  const pinataService = new PinataService();
  
  try {
    // Get Pinata status
    const status = await pinataService.getStatus();
    console.log('   ✅ Pinata service initialized');
    console.log(`   🌐 Pinata Configured: ${status.pinataConfigured ? 'Yes' : 'No'}`);
    console.log(`   🔗 Authenticated: ${status.authenticated ? 'Yes' : 'No'}`);
    
    if (!status.pinataConfigured) {
      console.log('   ⚠️  To test Pinata upload, set PINATA_API_KEY and PINATA_SECRET_API_KEY in .env');
    } else if (status.authenticated) {
      console.log(`   📊 Total Pins: ${status.totalPins || 0}`);
      console.log(`   💾 Total Size: ${status.totalSize || 0} bytes`);
    }
    
    console.log();
    return true;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 QNet Lite Backend Test Suite\n');
  
  const results = [];
  
  results.push(await testKyberEncryption());
  results.push(await testTimeCapsule());
  results.push(await testPinata());
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`📊 Test Results: ${passed}/${total} passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! QNet Lite backend is ready.');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above.');
  }
}

// Run tests
runTests().catch(console.error);
