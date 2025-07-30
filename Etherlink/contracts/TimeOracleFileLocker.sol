// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TimeOracleFileLocker {
    
    struct LockedFile {
        string ipfsHash;           
        string fileName;           
        uint256 unlockTimestamp;   
        address owner;             
        uint256 lockFee;           
        bool isUnlocked;           
        bool exists;               
    }
    
    mapping(bytes32 => LockedFile) public lockedFiles;
    mapping(address => bytes32[]) public userFiles;
    

    string public rollupAddress = "sr1MYkp5MprutS16fkJP6ZNAt8adgnMozWhj";
    
    event FileLocked(bytes32 indexed fileId, address indexed owner, string ipfsHash, uint256 unlockTimestamp, uint256 lockFee);
    event UnlockRequested(bytes32 indexed fileId, address indexed owner, string rollupAddress, uint256 unlockTimestamp);
    event FileUnlocked(bytes32 indexed fileId, address indexed owner);
    
    function lockFile(
        string memory ipfsHash,
        string memory fileName,
        uint256 unlockTimestamp
    ) external payable returns (bytes32 fileId) {
        require(bytes(ipfsHash).length > 0, "IPFS hash required");
        require(bytes(fileName).length > 0, "File name required");
        require(unlockTimestamp > block.timestamp, "Must be future time");
        require(msg.value > 0, "Lock fee required");
        
        fileId = keccak256(abi.encodePacked(msg.sender, ipfsHash, unlockTimestamp, block.timestamp));
        require(!lockedFiles[fileId].exists, "File already locked");
        
        lockedFiles[fileId] = LockedFile({
            ipfsHash: ipfsHash,
            fileName: fileName,
            unlockTimestamp: unlockTimestamp,
            owner: msg.sender,
            lockFee: msg.value,
            isUnlocked: false,
            exists: true
        });
        
        userFiles[msg.sender].push(fileId);
        emit FileLocked(fileId, msg.sender, ipfsHash, unlockTimestamp, msg.value);
        
        return fileId;
    }
    
    function requestUnlock(bytes32 fileId) external {
        LockedFile storage file = lockedFiles[fileId];
        require(file.exists, "File doesn't exist");
        require(file.owner == msg.sender, "Only owner can unlock");
        require(!file.isUnlocked, "Already unlocked");
        
        emit UnlockRequested(fileId, msg.sender, rollupAddress, file.unlockTimestamp);
    }
    
    function confirmUnlock(bytes32 fileId) external payable {
        LockedFile storage file = lockedFiles[fileId];
        require(file.exists, "File doesn't exist");
        require(file.owner == msg.sender, "Only owner can unlock");
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
        uint256 lockFee,
        bool isUnlocked
    ) {
        LockedFile storage file = lockedFiles[fileId];
        require(file.exists, "File doesn't exist");
        return (file.ipfsHash, file.fileName, file.unlockTimestamp, file.owner, file.lockFee, file.isUnlocked);
    }
    
    function getUserFiles(address user) external view returns (bytes32[] memory) {
        return userFiles[user];
    }
}