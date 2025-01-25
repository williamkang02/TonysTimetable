import React, { useState } from "react";
import { Send, Paperclip } from 'lucide-react';
import '../../styles/gpt.css';

const GPTAssist = () => {
  const [query, setQuery] = useState(''); // State to store user input query
  const [conversation, setConversation] = useState([]); // State to store the conversation
  const [suggestedChanges, setSuggestedChanges] = useState(null); // Store suggested changes for approval
  const [file, setFile] = useState(null); // Store the uploaded file
  const [fileName, setFileName] = useState(''); // Store the uploaded file name
  const [loading, setLoading] = useState(false); // Track loading state
  const [error, setError] = useState(null); // Track error messages

  // Function to fetch the JSON from your edge function based on user query
  const fetchSuggestions = async (currentQuery) => {
    if (!currentQuery) return;

    try {
      const response = await fetch("https://epzbzgpckybkcuujwiac.supabase.co/functions/v1/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ query: currentQuery, action: "fetch_suggestions" }), // Send the user query
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Received data:", data); // Debugging: Check if data is received

      const newMessage = {
        type: "response",
        text: data.description || data.info || "No description provided.",
        json: data.jsonChanges || null, // Only set JSON if suggestions exist
        showButtons: !!data.jsonChanges, // Show buttons only if suggestions exist
      };

      setConversation((prev) => [
        ...prev,
        { type: "user", text: currentQuery }, 
        newMessage
      ]);
      setSuggestedChanges(data.jsonChanges || null); // Store the suggestions for approval if any
    } catch (err) {
      console.error("Error fetching suggestions:", err);
      setError("Error fetching suggestions from GPT");
    } finally {
      setLoading(false);
    }
  };

  // Function to handle form submission with the typed query
  const handleSubmitQuery = async () => {
    if (!query && !file) {
      setError("Please enter a query or upload a file.");
      return;
    }
    setLoading(true);
    setError(null); // Clear previous errors
    
    if (file) {
      // Handle file submission if a file is uploaded
      await handleFileSubmission(file);
    } else {
      // Handle text-based query submission
      fetchSuggestions(query);
    }
    
    setQuery(''); // Clear the input field after submission
    setFile(null); // Clear the file after submission
    setFileName(''); // Clear the file name
  };

  // Function to handle MP3 and TXT file submission to the backend
  const handleFileSubmission = async (file) => {
    if (file.type === "text/plain") {
      // Handle TXT file
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileContent = event.target.result;
        fetchSuggestions(fileContent); // Send the file content as the query
      };
      reader.readAsText(file); // Read the file content as text
    } else if (file.type === "audio/mpeg") {
      // Handle MP3 file
      const formData = new FormData();
      formData.append('file', file); // Append the MP3 file to the form data

      try {
        // Call the edge function to transcribe the MP3 file
        const response = await fetch("https://epzbzgpckybkcuujwiac.supabase.co/functions/v1/speechToText", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`, // Add Authorization header
          },
          body: formData, // Send the MP3 file as form data
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const contentType = response.headers.get("Content-Type");
        let data;
        if (contentType && contentType.includes("application/json")) {
          data = await response.json(); // If it's JSON, parse as JSON
        } else {
          data = await response.text(); // If it's plain text, read it as text
        }

        const transcribedText = typeof data === "string" ? data : data.transcribedText;
        fetchSuggestions(transcribedText); // Fetch GPT suggestions based on the transcribed text

      } catch (err) {
        console.error("Error processing MP3 file:", err);
        setError("Error processing MP3 file");
      }
    } else {
      setError("Unsupported file type. Please upload a .txt or .mp3 file.");
    }
    setLoading(false); // Reset loading state after processing the file
  };

  // Handle file upload and store it in state
  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile); // Store the file in state
    setFileName(uploadedFile.name); // Store the file name for display
  };

  // Handle "Enter" key submission
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmitQuery();
    }
  };
  // Function to handle approving the suggested changes
  const handleApprove = async () => {
    try {
      await fetch("https://epzbzgpckybkcuujwiac.supabase.co/functions/v1/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ action: "approve", query: suggestedChanges }), // Send the suggestions to be approved
      });
      alert("Changes approved and applied to the database.");
      setConversation((prev) => [...prev, { type: "system", text: "Changes have been approved." }]);
      setSuggestedChanges(null); // Clear the suggestions after approval
    } catch (err) {
      console.error("Error approving changes:", err);
      setError("Error approving changes");
    }
  };

  // Function to handle rejecting the changes
  const handleReject = () => {
    setConversation((prev) => [...prev, { type: "system", text: "Changes have been rejected." }]);
    setSuggestedChanges(null); // Clear the suggestions after rejection
  };
  return (
    <div className="chat-container">
        {/* Chatbox container */}
        <div className="chat-box">
            {conversation.map((msg, index) => (
            <div key={index} className={`chat-message ${msg.type}`}>
                {msg.type === "user" ? (
                <div className="user-message">
                    <strong>You:</strong> {msg.text}
                </div>
                ) : msg.type === "response" ? (
                <div className="gpt-response">
                    <strong>GPT:</strong> {msg.text}
                    {msg.json && (
                    <pre className="json-output">
                        {JSON.stringify(msg.json, null, 2)}
                    </pre>
                    )}
                    {msg.showButtons && (
                    <div className="action-buttons">
                        <button className="response-button" onClick={handleApprove}>Approve</button>
                        <button className="response-button" onClick={handleReject}>Reject</button>
                    </div>
                    )}
                </div>
                ) : (
                <div className="system-message">{msg.text}</div>
                )}
            </div>
            ))}
        </div>

        {/* Input field for user to type in the query */}
        <div className="input-container">
            <input 
                type="text" 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                onKeyPress={handleKeyPress} // Listen for "Enter" key press
                placeholder="Message ChatGPT..." 
                className="query-input"
            />

            <button
                className="file-upload-button"
                onClick={() => document.getElementById('file-input').click()}
            >
                <Paperclip />
            </button>

            <button className="gpt-button" onClick={handleSubmitQuery}>
                <Send />
            </button>

            {/* Hidden file input */}
            <input
                type="file"
                accept=".txt,.mp3"
                onChange={handleFileUpload}
                id="file-input"
                style={{ display: 'none' }} // Hide the default file input
            />
        </div> 

        {/* Display file name when uploaded */}
        {fileName && <p className="file-upload-message">File uploaded: {fileName}</p>}

        {loading && <p>Processing...</p>}
        {error && <p className="error">{error}</p>}
        </div>
  );
};

export default GPTAssist;
