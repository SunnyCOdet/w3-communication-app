# Web3 Chat dApp (with Simulated Gemini Backend Interaction)

This project demonstrates a basic decentralized chat application using Solidity for the backend (smart contract) and React for the frontend. It now includes a **simulated interaction** with a backend service that *would* connect to an LLM like Google Gemini.

**IMPORTANT:** Due to the limitations of the WebContainer environment (especially regarding secure API key management and running backend servers), the AI interaction is **simulated entirely on the frontend**. This README explains how a real integration would work with a separate backend server.

## Project Structure

```
/
├── backend/
│   └── contracts/
│       └── Chat.sol        # Smart contract for chat logic
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx         # Main application component
│   │   ├── ChatInterface.jsx # Handles messages & simulates AI backend call
│   │   ├── ConnectWallet.jsx # Wallet connection button
│   │   ├── abi.json        # Contract Application Binary Interface
│   │   ├── index.css       # Basic styling
│   │   └── main.jsx        # React entry point
│   ├── index.html          # HTML entry point
│   ├── package.json        # Frontend dependencies and scripts
│   └── vite.config.js      # Vite configuration
└── README.md               # This file
```

## Backend (Smart Contract - `Chat.sol`)

The `Chat.sol` contract remains the same, providing the core on-chain chat logic (storing messages, usernames, emitting events). See previous README versions for details.

## Frontend (React + Ethers.js + Simulated Backend Call)

The frontend uses React, Vite, and `ethers.js` for blockchain interaction.

1.  **Wallet Connection & Contract Interaction:** Standard connection via MetaMask and interaction with the deployed `Chat` contract using its address and ABI.
2.  **Sending/Receiving Messages:** Users send messages via `sendMessage` (on-chain transaction). New messages are displayed by listening to the `MessageSent` event.
3.  **Simulated AI Interaction:**
    *   When a user sends a message containing "@AI", the frontend's `ChatInterface.jsx` component triggers the `getAIResponseFromBackend` function.
    *   This function **simulates** making a network request to a hypothetical backend endpoint (e.g., `/api/ask-gemini`).
    *   It introduces an artificial delay (`setTimeout`) to mimic network latency.
    *   Instead of actually calling an external API, it calls a local JavaScript function (`getSimpleAIResponse`) to generate a canned response based on keywords.
    *   An "AI Bot (Simulated)" message with this canned response is added directly to the frontend's message list. A "Thinking..." indicator is shown during the simulated delay.
    *   **Crucially, no actual backend or Gemini API call occurs in this simulation.**

## Setup and Running

**1. Backend: Compile and Deploy Smart Contract**

(Instructions remain the same - use Remix or Hardhat locally)

*   Deploy `backend/contracts/Chat.sol` to a test network (e.g., Sepolia).
*   Copy the deployed contract **address**.
*   Copy the contract **ABI** from the compiler.

**2. Frontend: Configure and Run**

*   **Update Contract Address:** In `frontend/src/App.jsx`, replace `"YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE"` with the deployed address.
*   **Update ABI:** Paste the copied ABI into `frontend/src/abi.json`, replacing the placeholder content.
*   **Install Dependencies:**
    ```bash
    cd frontend
    npm install
    ```
*   **Start Development Server:**
    ```bash
    npm run dev
    ```
    Open the provided URL in your browser.

**3. Using the dApp**

*   Connect your wallet.
*   Optionally set a nickname.
*   Send messages.
*   Send a message containing "@AI" (e.g., `"@AI explain smart contracts"`). You will see a "Thinking..." message, followed by a simulated response from "AI Bot (Simulated)".

## Integrating a Real LLM (e.g., Gemini) - Conceptual Backend

To connect this dApp to a real LLM like Gemini, you would need to build and host a separate backend service (outside of this WebContainer environment). Here's a conceptual example using Node.js and Express:

**1. Backend Server (`server.js` - Run outside WebContainer)**

```javascript
// server.js (Conceptual Example - Requires Node.js environment)
// Install dependencies: npm install express @google/generative-ai dotenv cors
require('dotenv').config(); // Use environment variables for API key
const express = require('express');
const cors = require('cors'); // To allow requests from your frontend
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3001; // Use a different port than the frontend

// --- IMPORTANT: Securely load your API key ---
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  console.error("Error: GEMINI_API_KEY environment variable not set.");
  process.exit(1); // Exit if key is missing
}

// --- Configure Gemini ---
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Or your desired model

// --- Middleware ---
app.use(cors()); // Configure CORS appropriately for your frontend URL in production
app.use(express.json()); // Parse JSON request bodies

// --- API Endpoint ---
app.post('/api/ask-gemini', async (req, res) => {
  const userPrompt = req.body.prompt;

  if (!userPrompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  console.log(`Received prompt for Gemini: "${userPrompt}"`);

  try {
    const result = await model.generateContent(userPrompt);
    const response = await result.response;
    const text = response.text();

    console.log(`Gemini Response: "${text}"`);
    res.json({ response: text }); // Send response back to frontend

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    res.status(500).json({ error: 'Failed to get response from AI' });
  }
});

app.listen(port, () => {
  console.log(`Conceptual AI Backend server listening on port ${port}`);
});
```

**Key Backend Points:**

*   **API Key Security:** The `GEMINI_API_KEY` is loaded from environment variables (`.env` file locally, or system environment variables in hosting). **Never hardcode API keys in your code.**
*   **Dependencies:** Requires `express`, `@google/generative-ai`, `dotenv`, `cors`.
*   **Endpoint:** Creates a `/api/ask-gemini` endpoint that accepts POST requests with a JSON body like `{ "prompt": "user's message" }`.
*   **Gemini Call:** Uses the `@google/generative-ai` SDK to send the prompt to the Gemini API.
*   **Response:** Sends the AI's text response back to the frontend as JSON.
*   **CORS:** Needs `cors` middleware configured to allow requests from your frontend's domain.
*   **Hosting:** This backend needs to be hosted on a platform like Vercel, Render, Heroku, or a traditional server.

**2. Frontend `fetch` Call (Actual Implementation)**

In `frontend/src/ChatInterface.jsx`, the `getAIResponseFromBackend` function would be modified to make a real `fetch` call:

```javascript
  // Inside ChatInterface.jsx
  const getAIResponseFromBackend = useCallback(async (messageContent) => {
    setIsAILoading(true);
    setError('');
    const backendUrl = 'YOUR_HOSTED_BACKEND_URL'; // e.g., 'https://your-ai-backend.onrender.com'

    try {
      const response = await fetch(`${backendUrl}/api/ask-gemini`, { // Call your hosted backend
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: messageContent.replace('@ai', '').trim() }) // Send clean prompt
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown backend error' })); // Try to parse error
        throw new Error(`Backend Error (${response.status}): ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      const aiResponseContent = data.response;

      // Add the actual AI response to the message list
      const aiMessage = {
          id: `ai-${Date.now()}`,
          sender: '0x000000000000000000000000000000000000AI', // Or a dedicated AI address
          senderDisplay: 'AI Bot', // Real AI Bot
          content: aiResponseContent,
          timestamp: new Date().toLocaleString(),
          isAIMessage: true,
      };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);

    } catch (err) {
      console.error("Error fetching AI response from backend:", err);
      setError(`AI Error: ${err.message}`);
      // Optionally add an error message to the chat for the user
       const aiErrorMessage = {
          id: `ai-error-${Date.now()}`,
          sender: '0x000000000000000000000000000000000000AI',
          senderDisplay: 'AI Bot',
          content: `Sorry, I encountered an error trying to respond. (${err.message})`,
          timestamp: new Date().toLocaleString(),
          isAIMessage: true, // Style as AI message maybe?
      };
      setMessages((prevMessages) => [...prevMessages, aiErrorMessage]);

    } finally {
      setIsAILoading(false);
    }
  }, []); // Add dependencies like setMessages, setError if needed by ESLint
```

This conceptual outline shows the necessary steps for a real integration, highlighting the crucial role of a secure, separate backend service.
