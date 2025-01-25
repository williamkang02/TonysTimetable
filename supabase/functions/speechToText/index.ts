// Implement text to speech functionality for AI assistant
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts'

// Fetch the OpenAI API Key from the environment variables
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

serve(async (req) => {
  // Handle preflight OPTIONS request for CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return new Response("Only POST method is allowed", { status: 405, headers: corsHeaders });
    }

    // Parse the form data to extract the uploaded file (MP3)
    const formData = await req.formData();
    const audioFile = formData.get("file") as File;

    if (!audioFile) {
      return new Response("No audio file provided", { status: 400, headers: corsHeaders });
    }

    // Prepare FormData to send to OpenAI's Whisper API
    const openAiFormData = new FormData();
    openAiFormData.append("file", audioFile); // Append the audio file to FormData
    openAiFormData.append("model", "whisper-1"); // Specify the Whisper model

    // Send the MP3 file to the Whisper API for transcription
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`, // Use the OpenAI API key
        // The Content-Type is automatically handled by FormData
      },
      body: openAiFormData, // Send the FormData containing the MP3 and model
    });

    // Handle the response from OpenAI's Whisper API
    if (!response.ok) {
      const errorData = await response.json();
      return new Response(`Error: ${JSON.stringify(errorData)}`, { status: response.status, headers: corsHeaders });
    }

    // Extract the transcription result from the Whisper API
    const result = await response.json();

    // Return the transcribed text to the client
    return new Response(result.text, { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error("Error transcribing audio:", error);
    return new Response("Failed to transcribe audio", { status: 500, headers: corsHeaders });
  }
});