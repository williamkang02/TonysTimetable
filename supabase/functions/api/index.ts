// Receive query from user, send to OpenAI api and carry out CRUD operation
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.16.0?target=deno";
import { corsHeaders } from '../_shared/cors.ts'

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

serve(async (req) => {
  try {
    // Handle preflight CORS requests
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Read the request body only once
    let requestBody;
    if (req.method === "POST") {
      requestBody = await req.json(); // Read the body once and store it for reuse
      const { query, action } = requestBody; // Extract relevant fields from the body
    
      // Connect to your Supabase instance
      const supabaseUrl = Deno.env.get("MY_SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("MY_SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);
    
      if (action === "fetch_suggestions") {
        // Fetch data from multiple tables in Supabase
        const { data: classesData, error: classesError } = await supabase.from("Classes").select("*");
        const { data: staffData, error: staffError } = await supabase.from("Staff").select("*");
        const { data: coursesData, error: coursesError } = await supabase.from("Courses").select("*");
        const { data: campusesData, error: campusesError } = await supabase.from("Campuses").select("*");
        const { data: studentsData, error: studentsError } = await supabase.from("Students").select("*");
        const { data: subjectsData, error: subjectsError } = await supabase.from("Subjects").select("*");
        const { data: locationsData, error: locationsError } = await supabase.from("Locations").select("*");
        const { data: enrolmentData, error: enrolmentError } = await supabase.from("StudentSubject").select("*");
    
        // Check for errors in querying the database
        if (classesError || staffError || coursesError || campusesError || studentsError || subjectsError || locationsError || enrolmentError) {
          throw new Error("Error querying database");
        }
    
        const dbData = {
          Classes: classesData,
          Staff: staffData,
          Courses: coursesData,
          Campuses: campusesData,
          Students: studentsData,
          Subjects: subjectsData,
          Location: locationsData,
          StudentSubject: enrolmentData,
        };
    
        // GPT API request to get suggestions based on the database content
        const messages = [
          {
            role: "system",
            content: `You are an expert admin assistant. When receive query, first identify admin ask for information in database or ask you for help with changes or create instance in database.
            If the admin asks for information from the database, only reply with a paragraph of description that starts with "Required Information:". Make sure to list out every information admin ask for. 
            If the admin asks for help with changes or optimizations, 
            provide two parts in the output: JSON format of changes made based on the specific table or multiple tables they 
            asked for in the database always start with this structure, table name, then the attributes of the instances
            (always start with the "id", then other attributes), followed by a description of the changes made. 
            Ask for whether the admin approves it or not.`
          },
          {
            role: "user",
            content: `Here is the database content:\n${JSON.stringify(dbData, null, 2)}.\n\nUser query: ${query}`,
          },
        ];
    
        const openaiApiKey = Deno.env.get("OPENAI_API_KEY")!;
        const openaiResponse = await fetch(OPENAI_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiApiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini-2024-07-18",
            messages: messages,
            max_tokens: 500,
            temperature: 0.7,
          }),
        });
    
        if (!openaiResponse.ok) {
          const errorDetails = await openaiResponse.json();
          throw new Error(`OpenAI API error: ${errorDetails.error.message}`);
        }
    
        const openaiOptimizedData = await openaiResponse.json();
        const gptResponseText = openaiOptimizedData.choices[0].message.content.trim();
    
        if (gptResponseText !== null) {
          // Check if the response starts with "Required Information:"
          if (gptResponseText.startsWith("Required Information:")) {
            // Handle info request
            return new Response(
              JSON.stringify({ info: gptResponseText }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          } else {
            // Handle suggestions/optimizations
            const jsonStartIndex = gptResponseText.indexOf("{");
            const jsonEndIndex = gptResponseText.lastIndexOf("}") + 1;
            if (jsonStartIndex === -1 || jsonEndIndex === -1) {
              throw new Error("No JSON found in GPT response.");
            }
    
            const jsonPart = gptResponseText.substring(jsonStartIndex, jsonEndIndex).trim();
            const textPart = gptResponseText.substring(jsonEndIndex).trim();
    
            let suggestedChanges;
            try {
              suggestedChanges = JSON.parse(jsonPart);
            } catch (err) {
              throw new Error("Error parsing the JSON changes from GPT response.");
            }
    
            return new Response(
              JSON.stringify({ description: textPart, jsonChanges: suggestedChanges }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } else {
          throw new Error("GPT response is null.");
        }
      } else if (action === "approve") {
        if (!query || typeof query !== "object") {
          return new Response(JSON.stringify({ error: "No valid changes provided" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          });
        }
        console.log("json", JSON.stringify(query));
        // Apply the changes provided by the frontend
        for (const [tableName, changes] of Object.entries(query)) {
          const changesArray = Array.isArray(changes) ? changes : [changes];
          for (const change of changesArray) {
            const { id, ...updatedFields } = change; // Extract the id and fields to update
            if (id === null || id === undefined){
                return new Response(JSON.stringify({ error: `Missing 'id' in changes for table ${tableName} `}), {
                  headers: { ...corsHeaders, "Content-Type": "application/json" },
                  status: 400,
                });
              }
            const { data: existingData, error: checkError } = await supabase.from(tableName).select("id").eq("id", id).single();
            console.log("id", id);
            if (checkError) {
              const { error: insertError } = await supabase.from(tableName).insert([updatedFields]);
                 if (insertError) {
                    return new Response(JSON.stringify({ error: `Error inserting into ${tableName}: ${insertError.message} `}), {
                        headers: { ...corsHeaders, "Content-Type": "application/json" },
                        status: 500,
                });
              }
            }
            else if (existingData) {
              const { error } = await supabase.from(tableName).update(updatedFields).eq("id", id);
              if (error) {
                return new Response(JSON.stringify({ error: `Error updating ${tableName}: ${error.message} `}), {
                  headers: { ...corsHeaders, "Content-Type": "application/json" },
                  status: 500,
                });
              }
          }
            }
          }
      
        return new Response(JSON.stringify({ message: "Changes approved and applied to all rows" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        return new Response(JSON.stringify({ error: "Invalid action." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    } else {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 405,
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});