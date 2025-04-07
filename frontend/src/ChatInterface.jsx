import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';

// Simple function to simulate getting an AI response (Placeholder for backend call)
const getSimpleAIResponse = (inputText) => {
  const lowerCaseInput = inputText.toLowerCase().replace('@ai', '').trim(); // Remove @ai tag
  console.log("Simulating AI for input:", lowerCaseInput);
  if (!lowerCaseInput) {
      return "You mentioned me (@AI)! How can I help?";
  } else if (lowerCaseInput.includes("hello") || lowerCaseInput.includes("hi")) {
    return "Hello there! This is a simulated response. In a real setup, I'd call the Gemini API.";
  } else if (lowerCaseInput.includes("help")) {
    return "I'm a simulated AI assistant. Mention '@AI' followed by your query. For example: '@AI what is blockchain?'";
  } else if (lowerCaseInput.includes("how are you")) {
    return "I'm a simulation running in your browser! A real AI would run on a server.";
  } else if (lowerCaseInput.includes("blockchain")) {
      return "Blockchain is a distributed, immutable ledger. This response is simulated; a real AI would give more detail.";
  } else {
    return `I received your message: "${lowerCaseInput}". This is a simulated response. A real backend would process this with Gemini.`;
  }
};


function ChatInterface({ contract, signer, account }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [username, setUsername] = useState('');
  const [userNickname, setUserNickname] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSettingUsername, setIsSettingUsername] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false); // State for AI thinking
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null); // Ref for scrolling

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // --- Function to SIMULATE calling a backend for AI response ---
  const getAIResponseFromBackend = useCallback(async (messageContent) => {
    setIsAILoading(true);
    setError(''); // Clear previous AI errors
    console.log("Simulating backend call for AI response to:", messageContent);

    // In a REAL implementation, this would be a fetch call:
    // try {
    //   const response = await fetch('/api/ask-gemini', { // Your backend endpoint
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ prompt: messageContent })
    //   });
    //   if (!response.ok) {
    //     throw new Error(`Backend error: ${response.statusText}`);
    //   }
    //   const data = await response.json();
    //   const aiResponseContent = data.response; // Assuming backend returns { response: "..." }
    //   // ... add AI message to state ...
    // } catch (err) {
    //   console.error("Error fetching AI response from backend:", err);
    //   setError(`AI Error: ${err.message}`);
    //   // ... maybe add an error message to chat ...
    // } finally {
    //   setIsAILoading(false);
    // }

    // --- Simulation Logic ---
    return new Promise((resolve) => {
      setTimeout(() => {
        const aiResponseContent = getSimpleAIResponse(messageContent);
        const aiMessage = {
            id: `ai-${Date.now()}`,
            sender: '0x000000000000000000000000000000000000AI',
            senderDisplay: 'AI Bot (Simulated)',
            content: aiResponseContent,
            timestamp: new Date().toLocaleString(),
            isAIMessage: true,
        };
        setMessages((prevMessages) => [...prevMessages, aiMessage]);
        setIsAILoading(false);
        resolve(); // Resolve the promise after simulation
      }, 1500 + Math.random() * 1000); // Simulate network delay (1.5 - 2.5s)
    });
    // --- End Simulation Logic ---

  }, []); // Keep dependencies minimal for simulation


  // Fetch messages function
  const fetchMessages = useCallback(async () => {
    // ... (fetchMessages logic remains the same)
    if (!contract) return;
    setError('');
    setIsLoadingMessages(true);
    try {
      const fetchedMessages = await contract.getMessages();
      const messagesWithUsernames = await Promise.all(
        fetchedMessages.map(async (msg) => {
          let senderUsername = await contract.getUsername(msg.sender);
          if (!senderUsername) {
             senderUsername = `${msg.sender.substring(0, 6)}...${msg.sender.substring(msg.sender.length - 4)}`;
          }
          return {
            id: `${msg.sender}-${msg.timestamp.toString()}`,
            sender: msg.sender,
            senderDisplay: senderUsername,
            content: msg.content,
            timestamp: new Date(msg.timestamp.toNumber() * 1000).toLocaleString(),
            isAIMessage: false,
          };
        })
      );
      setMessages(messagesWithUsernames);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError(`Failed to fetch messages: ${err.message || 'Check console for details.'}`);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [contract]);

  // Fetch current user's nickname
  const fetchUserNickname = useCallback(async () => {
    // ... (fetchUserNickname logic remains the same)
     if (!contract || !account) return;
     try {
       const nickname = await contract.getUsername(account);
       setUserNickname(nickname);
     } catch (err) {
       console.error("Error fetching username:", err);
     }
   }, [contract, account]);


  // Initial fetch and setup listener
  useEffect(() => {
    if (contract) {
      fetchMessages();
      fetchUserNickname();

      // --- Listener for new messages ---
      const messageListener = async (sender, content, timestamp) => {
        console.log('MessageSent event received:', sender, content, timestamp);
        const messageTimestamp = new Date(timestamp.toNumber() * 1000);
        const messageId = `${sender}-${timestamp.toString()}`;

        if (messages.some(msg => msg.id === messageId)) {
            console.log("Duplicate message event ignored:", messageId);
            return;
        }

        let senderDisplay = 'Unknown';
        try {
            senderDisplay = await contract.getUsername(sender);
            if (!senderDisplay) {
                senderDisplay = `${sender.substring(0, 6)}...${sender.substring(sender.length - 4)}`;
            }
        } catch (err) {
            console.error("Error fetching username for event:", err);
            senderDisplay = `${sender.substring(0, 6)}...${sender.substring(sender.length - 4)}`;
        }

        const receivedMessage = {
            id: messageId,
            sender: sender,
            senderDisplay: senderDisplay,
            content: content,
            timestamp: messageTimestamp.toLocaleString(),
            isAIMessage: false,
        };

        setMessages((prevMessages) => [...prevMessages, receivedMessage]);

        // --- Trigger AI Backend Call Simulation ---
        if (content.toLowerCase().includes('@ai')) {
            // Don't wait for the AI response here, let it run async
            getAIResponseFromBackend(content);
        }
        // --- End AI Trigger ---
      };

      // --- Listener for username changes ---
      const usernameListener = (user, newUsername) => {
          // ... (usernameListener logic remains the same)
          console.log('UsernameSet event received:', user, newUsername);
          if (user.toLowerCase() === account.toLowerCase()) {
              setUserNickname(newUsername);
          }
          setMessages(prevMessages =>
              prevMessages.map(msg =>
                  !msg.isAIMessage && msg.sender.toLowerCase() === user.toLowerCase()
                      ? { ...msg, senderDisplay: newUsername }
                      : msg
              )
          );
      };


      contract.on('MessageSent', messageListener);
      contract.on('UsernameSet', usernameListener);


      // Cleanup listener on component unmount
      return () => {
        if (contract) {
            contract.off('MessageSent', messageListener);
            contract.off('UsernameSet', usernameListener);
        }
      };
    }
  }, [contract, fetchMessages, fetchUserNickname, account, messages, getAIResponseFromBackend]); // Added getAIResponseFromBackend

   // Scroll to bottom when messages change
   useEffect(() => {
     scrollToBottom();
   }, [messages]);

  // Handle sending a message
  const handleSendMessage = async (e) => {
    // ... (handleSendMessage logic remains the same)
    e.preventDefault();
    if (!contract || !newMessage.trim()) return;
    setError('');
    setIsSending(true);
    try {
      const tx = await contract.sendMessage(newMessage.trim());
      console.log("Sending transaction:", tx.hash);
      setNewMessage('');
      await tx.wait();
      console.log("Transaction confirmed:", tx.hash);
    } catch (err) {
      console.error("Error sending message:", err);
      setNewMessage(newMessage);
      setError(`Failed to send message: ${err.data?.message || err.message || 'Transaction rejected or failed.'}`);
    } finally {
      setIsSending(false);
    }
  };

  // Handle setting username
  const handleSetUsername = async (e) => {
    // ... (handleSetUsername logic remains the same)
    e.preventDefault();
    if (!contract || !username.trim()) return;
    setError('');
    setIsSettingUsername(true);
    try {
      const tx = await contract.setUsername(username.trim());
      console.log("Setting username transaction:", tx.hash);
      setUsername('');
      await tx.wait();
      console.log("Username set confirmed:", tx.hash);
    } catch (err) {
      console.error("Error setting username:", err);
      setUsername(username);
      setError(`Failed to set username: ${err.data?.message || err.message || 'Transaction rejected or failed.'}`);
    } finally {
      setIsSettingUsername(false);
    }
  };


  return (
    <div className="chat-interface">
      <h2>Chat Room</h2>
       {error && <p className="error">{error}</p>}

       <div className="username-section">
         {/* ... (username section remains the same) ... */}
         <p>Your current nickname: <strong>{userNickname || 'Not Set'}</strong></p>
         <form onSubmit={handleSetUsername} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
           <input
             type="text"
             value={username}
             onChange={(e) => setUsername(e.target.value)}
             placeholder="Set your nickname"
             maxLength={32}
             disabled={isSettingUsername}
           />
           <button type="submit" disabled={isSettingUsername || !username.trim()}>
             {isSettingUsername ? 'Setting...' : 'Set Nickname'}
           </button>
         </form>
       </div>


      <div className="message-list">
        <h3>Messages</h3>
        {isLoadingMessages ? (
          <p className="loading">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p>No messages yet. Be the first to send one! Mention @AI for a simulated response.</p>
        ) : (
          <ul>
            {messages.map((msg) => (
              <li key={msg.id} style={{ background: msg.isAIMessage ? '#e0f7fa' : '#f9f9f9' }}>
                <span className="sender">
                    {msg.senderDisplay}
                    {!msg.isAIMessage && ` (${msg.sender.substring(0, 6)}...${msg.sender.substring(msg.sender.length - 4)})`}
                    :
                </span>
                {msg.content}
                <span className="timestamp">{msg.timestamp}</span>
              </li>
            ))}
             {isAILoading && ( // Show AI thinking indicator
                <li key="ai-loading" style={{ background: '#e0f7fa', fontStyle: 'italic', color: '#555' }}>
                    <span className="sender">AI Bot (Simulated):</span>
                    Thinking...
                </li>
             )}
             <div ref={messagesEndRef} /> {/* Element to scroll to */}
          </ul>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="message-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message... Mention @AI to talk to the bot."
          disabled={isSending || isAILoading} // Disable input while sending or AI thinking
        />
        <button type="submit" disabled={isSending || isAILoading || !newMessage.trim()}>
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

export default ChatInterface;
