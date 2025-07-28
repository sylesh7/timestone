#!/usr/bin/env node

console.log('🧪 Quick Frontend Integration Test\n');

import dotenv from 'dotenv';
import TimeCapsuleService from './src/services/timeCapsuleService.js';
import fs from 'fs';

// Load environment variables
dotenv.config();

async function createQuickTestCapsule() {
  console.log('Creating a quick test capsule for frontend testing...\n');
  
  try {
    const timeCapsuleService = new TimeCapsuleService();
    
    // Create test file content
    const testContent = 'Hello from the past! 🚀 This is a test message for frontend integration.';
    const fileBuffer = Buffer.from(testContent);
    
    // Set unlock time to 1 minute from now for quick testing
    const unlockTime = new Date(Date.now() + 60 * 1000); // 1 minute from now
    
    console.log('📝 Creating capsule with:');
    console.log(`   File: test-message.txt`);
    console.log(`   Content: "${testContent}"`);
    console.log(`   Unlock Time: ${unlockTime.toISOString()}`);
    console.log(`   Creator: frontend-test-creator`);
    console.log(`   Recipient: frontend-test-recipient\n`);
    
    const result = await timeCapsuleService.createTimeCapsule({
      fileBuffer: fileBuffer,
      fileName: 'test-message.txt',
      fileType: 'text/plain',
      unlockTimestamp: unlockTime.toISOString(),
      recipientAddress: 'frontend-test-recipient',
      creatorAddress: 'frontend-test-creator',
      message: 'This is a test capsule for frontend integration testing!'
    });
    
    if (result.success) {
      console.log('✅ Test capsule created successfully!\n');
      
      const testData = {
        capsuleId: result.capsule.id,
        privateKey: result.privateKey,
        unlockTime: unlockTime.toISOString(),
        testContent: testContent,
        recipientAddress: 'frontend-test-recipient',
        creatorAddress: 'frontend-test-creator',
        ipfsHash: result.capsule.pinata.ipfsHash,
        gateway: result.capsule.pinata.gateway,
        createdAt: new Date().toISOString()
      };
      
      // Save test data
      fs.writeFileSync('frontend-test-capsule.json', JSON.stringify(testData, null, 2));
      
      console.log('📋 Test Capsule Details:');
      console.log('========================');
      console.log(`🆔 Capsule ID: ${testData.capsuleId}`);
      console.log(`🔑 Private Key: ${testData.privateKey.substring(0, 50)}...`);
      console.log(`⏰ Unlock Time: ${testData.unlockTime}`);
      console.log(`📁 IPFS Hash: ${testData.ipfsHash}`);
      console.log(`🌐 Gateway URL: ${testData.gateway}`);
      console.log();
      
      console.log('🧪 Frontend Testing Instructions:');
      console.log('==================================');
      console.log('1. Copy the Capsule ID above');
      console.log('2. Go to your frontend unlock page');
      console.log('3. Paste the Capsule ID');
      console.log('4. The private key should auto-fill');
      console.log('5. Enter "frontend-test-recipient" as requester address');
      console.log('6. Wait 1 minute for unlock time, then try unlocking');
      console.log();
      
      console.log('📄 Test data saved to: frontend-test-capsule.json');
      console.log();
      
      console.log('🔗 Quick Links:');
      console.log(`   Frontend Unlock: http://localhost:3000/unlock?capsuleId=${testData.capsuleId}`);
      console.log(`   IPFS Gateway: ${testData.gateway}`);
      
      return testData;
    } else {
      console.log('❌ Failed to create test capsule:', result.error);
      return null;
    }
  } catch (error) {
    console.error('💥 Error creating test capsule:', error.message);
    return null;
  }
}

// Run test
createQuickTestCapsule()
  .then((result) => {
    if (result) {
      console.log('\n🎉 Test capsule ready for frontend testing!');
      console.log('⏰ Capsule will be unlockable in 1 minute.');
    } else {
      console.log('\n💥 Test failed!');
    }
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
  });
