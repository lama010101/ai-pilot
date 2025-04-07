
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// OpenAI API key
const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || '';

// Create Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to generate GPS coordinates for a location
async function geocodeLocation(locationName: string): Promise<{lat: number, lng: number} | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'AI-Pilot-WriterAgent/1.0'
        }
      }
    );
    
    if (!response.ok) {
      console.error("Geocoding error:", response.statusText);
      return null;
    }
    
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

// Generate prompts using OpenAI
async function generatePrompts(instructions: string, count: number = 5): Promise<any> {
  if (!openaiApiKey) {
    throw new Error("OpenAI API key is not configured");
  }
  
  const systemPrompt = `You are a specialized AI that generates detailed, historically accurate prompts for image generation of historical events.
For each prompt, provide comprehensive metadata including:
- A catchy title
- A short 1-2 sentence description
- A detailed 3-5 sentence description with historical context
- Two hints (one vague, one more specific)
- The precise year of the event
- The location including country
- GPS coordinates (latitude and longitude)

Your prompts should be vivid, historically accurate, and visually descriptive to help an image generation model create compelling historical images.`;

  const userPrompt = `Based on these instructions: "${instructions}", generate ${count} unique, detailed historical event prompts.
Format your response as a valid JSON object with an array of "entries" where each entry has:
{
  "prompt": "A detailed visual description for the image generator",
  "title": "Event title",
  "short_description": "1-2 sentence description",
  "detailed_description": "3-5 sentence detailed historical description",
  "hints": {
    "hint_1": "A vague hint about the event",
    "hint_2": "A more specific hint about the event"
  },
  "year": 1234,
  "address": "Location name, Country",
  "country": "Country name",
  "gps": {
    "lat": 12.34,
    "lng": 56.78
  }
}

For events where you're unsure of the exact GPS coordinates, provide your best estimate based on the historical location.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const parsedContent = JSON.parse(content);
      
      // Process each entry to ensure it has valid GPS coordinates
      const processedEntries = [];
      
      for (const entry of parsedContent.entries) {
        let entryWithGPS = { ...entry };
        
        // If GPS coordinates are missing or invalid, try to geocode the location
        if (!entry.gps || !entry.gps.lat || !entry.gps.lng) {
          const locationToGeocode = entry.address || entry.country;
          if (locationToGeocode) {
            const gpsCoords = await geocodeLocation(locationToGeocode);
            if (gpsCoords) {
              entryWithGPS.gps = gpsCoords;
            }
          }
        }
        
        processedEntries.push(entryWithGPS);
      }
      
      return {
        entries: processedEntries,
        status: "success"
      };
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      throw new Error("Failed to parse the generated prompts");
    }
    
  } catch (error) {
    console.error("Error generating prompts:", error);
    throw error;
  }
}

// Main handler function
serve(async (req) => {
  console.log(`Received ${req.method} request to writer-agent`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    if (!openaiApiKey) {
      throw new Error("OpenAI API key is not configured in the edge function");
    }
    
    const { instructions, count = 5 } = await req.json();
    
    if (!instructions) {
      throw new Error("Instructions are required");
    }
    
    const promptCount = Math.min(Math.max(1, count), 10); // Limit between 1 and 10
    
    console.log(`Generating ${promptCount} prompts based on: "${instructions}"`);
    
    const result = await generatePrompts(instructions, promptCount);
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
    
  } catch (error) {
    console.error("Error in writer-agent function:", error);
    
    return new Response(JSON.stringify({
      entries: [],
      status: "error",
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
