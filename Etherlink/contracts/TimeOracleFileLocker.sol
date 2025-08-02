// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TimeOracleFileLocker {
    
    struct LockedFile {
        string ipfsHash;           
        string fileName;           
        uint256 unlockTimestamp;   
        address owner;             
        address recipient;         // Add recipient field
        uint256 lockFee;           
        bool isUnlocked;           
        bool exists;               
    }
    
    mapping(bytes32 => LockedFile) public lockedFiles;
    mapping(address => bytes32[]) public userFiles;        // Files owned by user
    mapping(address => bytes32[]) public recipientFiles;   // Files sent to user
    

    string public rollupAddress = "sr1CWGmH7T4ujK34pkFebfKpVQFeaxjvwjR2";
    
    event FileLocked(bytes32 indexed fileId, address indexed owner, address indexed recipient, string ipfsHash, uint256 unlockTimestamp, uint256 lockFee);
    event UnlockRequested(bytes32 indexed fileId, address indexed owner, string rollupAddress, uint256 unlockTimestamp);
    event FileUnlocked(bytes32 indexed fileId, address indexed owner);
    
    function lockFile(
        string memory ipfsHash,
        string memory fileName,
        uint256 unlockTimestamp,
        address recipient
    ) external payable returns (bytes32 fileId) {
        require(bytes(ipfsHash).length > 0, "IPFS hash required");
        require(bytes(fileName).length > 0, "File name required");
        require(unlockTimestamp > block.timestamp, "Must be future time");
        require(msg.value > 0, "Lock fee required");
        require(recipient != address(0), "Invalid recipient address");
        
        fileId = keccak256(abi.encodePacked(msg.sender, recipient, ipfsHash, unlockTimestamp, block.timestamp));
        require(!lockedFiles[fileId].exists, "File already locked");
        
        lockedFiles[fileId] = LockedFile({
            ipfsHash: ipfsHash,
            fileName: fileName,
            unlockTimestamp: unlockTimestamp,
            owner: msg.sender,
            recipient: recipient,
            lockFee: msg.value,
            isUnlocked: false,
            exists: true
        });
        
        userFiles[msg.sender].push(fileId);
        recipientFiles[recipient].push(fileId);
        emit FileLocked(fileId, msg.sender, recipient, ipfsHash, unlockTimestamp, msg.value);
        
        return fileId;
    }
    
    function requestUnlock(bytes32 fileId) external {
        LockedFile storage file = lockedFiles[fileId];
        require(file.exists, "File doesn't exist");
        require(file.owner == msg.sender || file.recipient == msg.sender, "Only owner or recipient can unlock");
        require(!file.isUnlocked, "Already unlocked");
        
        emit UnlockRequested(fileId, msg.sender, rollupAddress, file.unlockTimestamp);
    }
    
    function confirmUnlock(bytes32 fileId) external payable {
        LockedFile storage file = lockedFiles[fileId];
        require(file.exists, "File doesn't exist");
        require(file.owner == msg.sender || file.recipient == msg.sender, "Only owner or recipient can unlock");
        require(!file.isUnlocked, "Already unlocked");
        require(block.timestamp >= file.unlockTimestamp, "Unlock time not reached");

        file.isUnlocked = true;
        payable(file.owner).transfer(file.lockFee);
        emit FileUnlocked(fileId, file.owner);
    }
    
    function getFileInfo(bytes32 fileId) external view returns (
        string memory ipfsHash,
        string memory fileName,
        uint256 unlockTimestamp,
        address owner,
        address recipient,
        uint256 lockFee,
        bool isUnlocked
    ) {
        LockedFile storage file = lockedFiles[fileId];
        require(file.exists, "File doesn't exist");
        return (file.ipfsHash, file.fileName, file.unlockTimestamp, file.owner, file.recipient, file.lockFee, file.isUnlocked);
    }
    
    function getUserFiles(address user) external view returns (bytes32[] memory) {
        return userFiles[user];
    }
    
    // New function to get files sent to a recipient
    function getRecipientFiles(address recipient) external view returns (bytes32[] memory) {
        return recipientFiles[recipient];
    }
    
    // Get all files for a user (both owned and received)
    function getAllUserFiles(address user) external view returns (bytes32[] memory) {
        bytes32[] memory ownedFiles = userFiles[user];
        bytes32[] memory receivedFiles = recipientFiles[user];
        
        bytes32[] memory allFiles = new bytes32[](ownedFiles.length + receivedFiles.length);
        
        uint256 index = 0;
        for (uint256 i = 0; i < ownedFiles.length; i++) {
            allFiles[index] = ownedFiles[i];
            index++;
        }
        for (uint256 i = 0; i < receivedFiles.length; i++) {
            allFiles[index] = receivedFiles[i];
            index++;
        }
        
        return allFiles;
    }
}