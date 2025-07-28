import TimeCapsuleService from './src/services/timeCapsuleService.js';
import fs from 'fs';

console.log('🧪 Creating Test Time Capsule\n');

async function createTestCapsule() {
  const timeCapsuleService = new TimeCapsuleService();
  
  try {
    // Create test file content
    const testMessage = 'Hello from the past! This is a test time capsule created on ' + new Date().toISOString();
    const fileBuffer = Buffer.from(testMessage, 'utf8');
    
    // Set unlock time 5 minutes from now for testing
    const unlockTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    console.log('📝 Creating capsule with:');
    console.log(`   Content: "${testMessage}"`);
    console.log(`   Unlock Time: ${unlockTime.toISOString()}`);
    console.log(`   File Size: ${fileBuffer.length} bytes\n`);
    
    // Create the capsule
    const result = await timeCapsuleService.createTimeCapsule({
      fileBuffer,
      fileName: 'test-message.txt',
      fileType: 'text/plain',
      unlockTimestamp: unlockTime.toISOString(),
      recipientAddress: '0x1234567890abcdef1234567890abcdef12345678',
      creatorAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
      message: 'This is a test capsule for debugging'
    });
    
    console.log('✅ Time Capsule Created Successfully!\n');
    console.log('📊 Capsule Details:');
    console.log(`   🆔 Capsule ID: ${result.capsule.id}`);
    console.log(`   🌐 IPFS Hash: ${result.capsule.ipfsHash}`);
    console.log(`   📁 File Name: ${result.capsule.fileName}`);
    console.log(`   🕒 Created At: ${result.capsule.metadata.createdAt}`);
    console.log(`   🔓 Unlock Time: ${result.capsule.metadata.unlockTimestamp}`);
    console.log(`   🔗 Gateway: ${result.capsule.pinata.gateway}\n`);
    
    console.log('🔐 IMPORTANT - Save Your Private Key:');
    console.log('=====================================');
    console.log(JSON.stringify(result.privateKey, null, 2));
    console.log('=====================================\n');
    
    // Save to file for easy access
    const testData = {
      capsuleId: result.capsule.id,
      privateKey: result.privateKey,
      unlockTimestamp: unlockTime.toISOString(),
      ipfsHash: result.capsule.ipfsHash,
      gateway: result.capsule.pinata.gateway,
      createdAt: new Date().toISOString(),
      recipients: {
        recipientAddress: '0x1234567890abcdef1234567890abcdef12345678',
        creatorAddress: '0xabcdef1234567890abcdef1234567890abcdef12'
      }
    };
    
    fs.writeFileSync('test-capsule-data.json', JSON.stringify(testData, null, 2));
    console.log('💾 Test data saved to: test-capsule-data.json');
    
    // Instructions
    console.log('\n📋 Testing Instructions:');
    console.log('========================');
    console.log('1. Use the Capsule ID in your frontend');
    console.log('2. Use the Private Key for unlocking');
    console.log('3. Wait until unlock time or modify for immediate testing');
    console.log('4. Check IPFS gateway to verify upload\n');
    
    console.log('🌐 Frontend Test URLs:');
    console.log(`   Dashboard: http://localhost:3000/dashboard`);
    console.log(`   Unlock: http://localhost:3000/unlock?id=${result.capsule.id}`);
    
    return result;
    
  } catch (error) {
    console.error('❌ Error creating test capsule:', error.message);
    console.error(error.stack);
  }
}

// Run the test
createTestCapsule()
  .then(() => {
    console.log('\n🎉 Test capsule creation completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });
