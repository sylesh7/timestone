#!/usr/bin/env node

console.log('🔧 QNet Lite Backend Fix & Debug Tool\n');

import dotenv from 'dotenv';
import TimeCapsuleService from './src/services/timeCapsuleService.js';
import PinataService from './src/services/pinataService.js';
import fs from 'fs';

// Load environment variables
dotenv.config();

async function diagnoseAndFix() {
  console.log('1. Checking Environment Variables...');
  
  const envVars = {
    PINATA_API_KEY: process.env.PINATA_API_KEY,
    PINATA_SECRET_API_KEY: process.env.PINATA_SECRET_API_KEY,
    PINATA_JWT: process.env.PINATA_JWT
  };
  
  for (const [key, value] of Object.entries(envVars)) {
    const status = value ? '✅ PRESENT' : '❌ MISSING';
    console.log(`   ${key}: ${status}`);
  }
  
  if (!envVars.PINATA_API_KEY || !envVars.PINATA_SECRET_API_KEY) {
    console.log('\n❌ Missing Pinata credentials!');
    console.log('Please set PINATA_API_KEY and PINATA_SECRET_API_KEY in your .env file');
    return false;
  }
  
  console.log('\n2. Testing Pinata Connection...');
  
  const pinataService = new PinataService();
  try {
    const status = await pinataService.getStatus();
    console.log(`   Authentication: ${status.authenticated ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (status.authenticated) {
      console.log(`   Total Pins: ${status.totalPins || 0}`);
      console.log(`   Total Size: ${status.totalSize || 0} bytes`);
    }
  } catch (error) {
    console.log(`   ❌ Pinata Error: ${error.message}`);
    return false;
  }
  
  console.log('\n3. Checking In-Memory Capsules...');
  
  const timeCapsuleService = new TimeCapsuleService();
  const capsuleCount = timeCapsuleService.capsules.size;
  console.log(`   Capsules in memory: ${capsuleCount}`);
  
  if (capsuleCount === 0) {
    console.log('   ⚠️  No capsules in memory (this is normal after server restart)');
  } else {
    console.log('   📋 Capsules:');
    for (const [id, capsule] of timeCapsuleService.capsules.entries()) {
      console.log(`      ${id}: ${capsule.fileName} (${capsule.metadata.status})`);
    }
  }
  
  console.log('\n4. Checking IPFS Files...');
  
  try {
    const pinnedFiles = await pinataService.listPinnedFiles({ limit: 10 });
    console.log(`   Files on IPFS: ${pinnedFiles.count || 0}`);
    
    if (pinnedFiles.files && pinnedFiles.files.length > 0) {
      console.log('   📋 Recent Files:');
      pinnedFiles.files.forEach(file => {
        console.log(`      ${file.name}: ${file.ipfsHash} (${file.size} bytes)`);
      });
    }
  } catch (error) {
    console.log(`   ❌ IPFS List Error: ${error.message}`);
  }
  
  console.log('\n5. Testing Key Generation...');
  
  try {
    const timeCapsuleService = new TimeCapsuleService();
    const keyPair = timeCapsuleService.encryption.generateKeyPair();
    console.log(`   ✅ Key generation works`);
    console.log(`   Algorithm: ${keyPair.algorithm}`);
    
    // Test basic encryption
    const testData = 'Hello World';
    const encrypted = timeCapsuleService.encryption.encrypt(testData, keyPair.publicKey);
    const decrypted = timeCapsuleService.encryption.decrypt(encrypted, keyPair.privateKey);
    
    const works = testData === decrypted.toString();
    console.log(`   ${works ? '✅' : '❌'} Encryption/Decryption: ${works ? 'WORKS' : 'BROKEN'}`);
    
    if (!works) {
      console.log('   ❌ Basic encryption is broken!');
      return false;
    }
    
  } catch (error) {
    console.log(`   ❌ Encryption Error: ${error.message}`);
    return false;
  }
  
  console.log('\n✅ Diagnosis Complete!');
  console.log('\n📋 Common Issues & Solutions:');
  console.log('=============================');
  console.log('1. "Capsule not found":');
  console.log('   → Server restarted and lost in-memory capsules');
  console.log('   → Use the test scripts to create new capsules');
  console.log('');
  console.log('2. "Private key invalid":');
  console.log('   → Frontend using wrong private key for the capsule');
  console.log('   → Each capsule has a unique private key');
  console.log('   → Check localStorage for the correct key');
  console.log('');
  console.log('3. "Decryption failed":');
  console.log('   → Using wrong private key for the specific capsule');
  console.log('   → Private key format corrupted during storage');
  console.log('   → Use validate-key endpoint to check');
  console.log('');
  console.log('🛠️  Next Steps:');
  console.log('================');
  console.log('1. Run: node create-test-capsule.js');
  console.log('2. Copy the capsule ID and private key');
  console.log('3. Test unlock in frontend with the exact private key');
  console.log('4. Check browser localStorage for key storage');
  
  return true;
}

// Run diagnosis
diagnoseAndFix()
  .then((success) => {
    console.log(success ? '\n🎉 Diagnosis completed!' : '\n💥 Issues found!');
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n💥 Diagnosis failed:', error);
    process.exit(1);
  });
