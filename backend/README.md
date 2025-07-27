# QNet Lite Backend

## Quantum-Resistant Time Capsule Backend

This backend handles:
- Post-quantum encryption using Kyber
- IPFS file storage
- Encryption/Decryption services
- Time capsule metadata management

## Features

- **Kyber Post-Quantum Encryption**: Uses NIST-standardized Kyber for quantum-resistant encryption
- **IPFS Integration**: Secure file storage on IPFS
- **RESTful API**: Clean API endpoints for frontend integration
- **File Upload**: Support for text, images, and videos
- **Encryption Metadata**: Stores encryption parameters and keys

## Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

## API Endpoints

### Encryption
- `POST /api/encrypt` - Encrypt file/data with Kyber
- `POST /api/decrypt` - Decrypt file/data with Kyber

### IPFS
- `POST /api/upload` - Upload encrypted file to IPFS
- `GET /api/download/:cid` - Download file from IPFS

### Time Capsules
- `POST /api/capsule/create` - Create new time capsule
- `GET /api/capsule/:id` - Get capsule metadata
- `POST /api/capsule/unlock` - Unlock time capsule (after timestamp)

## Environment Variables

```env
PORT=3001
IPFS_NODE_URL=https://ipfs.infura.io:5001
WEB3_STORAGE_TOKEN=your_web3_storage_token
NODE_ENV=development
```

## Post-Quantum Encryption

This backend implements Kyber-768 for key encapsulation and AES-256-GCM for data encryption:

1. **Key Generation**: Generate Kyber public/private key pair
2. **Encapsulation**: Encapsulate AES key with Kyber public key
3. **Encryption**: Encrypt data with AES-256-GCM
4. **Storage**: Store encrypted data + encapsulated key on IPFS
5. **Decryption**: Decapsulate AES key with Kyber private key, then decrypt data