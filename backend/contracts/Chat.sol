// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol"; // Optional: For debugging during development (remove for production)

contract Chat {
    struct Message {
        address sender;
        string content;
        uint256 timestamp;
    }

    Message[] public messages;
    mapping(address => string) public usernames; // Optional: Map address to username

    event MessageSent(address indexed sender, string content, uint256 timestamp);
    event UsernameSet(address indexed user, string username);

    // Set or update username
    function setUsername(string memory _username) public {
        require(bytes(_username).length > 0, "Username cannot be empty");
        usernames[msg.sender] = _username;
        emit UsernameSet(msg.sender, _username);
    }

    // Send a message
    function sendMessage(string memory _content) public {
        require(bytes(_content).length > 0, "Message cannot be empty");

        uint256 timestamp = block.timestamp;
        messages.push(Message(msg.sender, _content, timestamp));

        // Optional: Log message details for debugging (if console.sol is imported)
        // console.log("Message Sent: Sender=%s, Content=%s, Timestamp=%d", msg.sender, _content, timestamp);

        emit MessageSent(msg.sender, _content, timestamp);
    }

    // Get all messages
    // Note: This can become expensive gas-wise if there are many messages.
    // Consider pagination or off-chain indexing for large scale apps.
    function getMessages() public view returns (Message[] memory) {
        return messages;
    }

    // Get the total number of messages
    function getMessageCount() public view returns (uint256) {
        return messages.length;
    }

    // Get username for an address
    function getUsername(address _user) public view returns (string memory) {
        return usernames[_user];
    }
}
