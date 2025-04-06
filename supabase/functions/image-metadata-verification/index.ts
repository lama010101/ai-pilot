
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create Supabase clients for both databases
const createSupabaseClient = (url: string, key: string) => {
  return createClient(url, key);
};

// Main Pilot DB
const pilotClient = createSupabaseClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_ANON_KEY') || ''
);

// Secondary Guess-History DB
const guessHistoryClient = createSupabaseClient(
  'https://pbpcegbobdnqqkloousm.supabase.co',
  Deno.env.get('GUESS_HISTORY_API_KEY') || ''
);

// Log process steps to system memory
async function logProcessStep(imageId: string, step: string, details: any) {
  try {
    await pilotClient
      .from('process_logs')
      .insert({
        image_id: imageId,
        step,
        details,
        timestamp: new Date().toISOString()
      });
    
    console.log(`Logged step: ${step} for image: ${imageId}`);
  } catch (error) {
    console.error(`Error logging step: ${error.message}`);
  }
}

// Run AI inference using OpenAI to extract metadata
async function runAIInference(imageUrl: string, imageId: string): Promise<any> {
  try {
    await logProcessStep(imageId, 'ai_inference_start', { imageUrl });
    
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      throw new Error('OpenAI API key not found');
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert image analyzer. Extract the following metadata from the image:
            1. Title: A concise title
            2. Description: Detailed description of what's in the image
            3. Date: The exact or approximate date of the event/photo (YYYY-MM-DD format if possible)
            4. Year: Just the year as a number
            5. Address: Location where the photo was taken
            6. GPS coordinates: Estimated latitude and longitude
            7. is_historical: Whether this depicts a historical event (true/false)
            8. is_ai_generated: Whether this image appears to be AI-generated (true/false)
            9. is_mature_content: Whether this contains mature/sensitive content (true/false)
            
            Return ONLY a JSON object with these fields, nothing else.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              },
              {
                type: 'text',
                text: 'Analyze this image and extract all the metadata fields specified. Return ONLY a JSON object.'
              }
            ]
          }
        ]
      })
    });
    
    const result = await response.json();
    const aiAnalysis = JSON.parse(result.choices[0].message.content);
    
    await logProcessStep(imageId, 'ai_inference_complete', { aiAnalysis });
    return aiAnalysis;
  } catch (error) {
    await logProcessStep(imageId, 'ai_inference_error', { error: error.message });
    throw new Error(`AI inference failed: ${error.message}`);
  }
}

// Run Image Recognition to verify the AI analysis
async function runImageRecognition(imageUrl: string, imageId: string): Promise<any> {
  try {
    await logProcessStep(imageId, 'image_recognition_start', { imageUrl });
    
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      throw new Error('OpenAI API key not found');
    }
    
    // Using OpenAI as our image recognition system with a different prompt
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an advanced image recognition system. Analyze the image and extract:
            1. Visual features: List all objects, landmarks, text, and people visible
            2. Time clues: Any indicators of when this was taken
            3. Location clues: Any indicators of where this was taken
            4. Scene classification: The type of scene or event
            5. Indicators of whether the image is AI-generated
            6. Indicators of whether the image contains mature content
            7. Indicators of whether this depicts a historical event
            
            Return ONLY a JSON object with these fields, nothing else.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              },
              {
                type: 'text',
                text: 'Analyze this image and extract all the features specified. Return ONLY a JSON object.'
              }
            ]
          }
        ]
      })
    });
    
    const result = await response.json();
    const recognitionResults = JSON.parse(result.choices[0].message.content);
    
    await logProcessStep(imageId, 'image_recognition_complete', { recognitionResults });
    return recognitionResults;
  } catch (error) {
    await logProcessStep(imageId, 'image_recognition_error', { error: error.message });
    throw new Error(`Image recognition failed: ${error.message}`);
  }
}

// Compare both outputs and compute accuracy scores
async function computeAccuracyScores(aiAnalysis: any, recognitionResults: any, imageId: string): Promise<any> {
  try {
    await logProcessStep(imageId, 'compute_accuracy_start', { aiAnalysis, recognitionResults });
    
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      throw new Error('OpenAI API key not found');
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an accuracy verification system. Compare the two analyses of the same image and compute accuracy scores between 0 (unreliable) and 1 (highly reliable) for each category.
            Return ONLY a JSON object with these accuracy fields:
            - accuracy_description: how reliable the description seems
            - accuracy_date: how reliable the date estimation seems
            - accuracy_location: how reliable the location estimation seems
            - accuracy_historical: how reliable the historical classification seems
            - accuracy_realness: how reliable the AI-generated classification seems
            - accuracy_maturity: how reliable the mature content classification seems
            
            For each field, explain briefly why you assigned that score, but be concise.`
          },
          {
            role: 'user',
            content: `AI Analysis: ${JSON.stringify(aiAnalysis)}
            
            Image Recognition Results: ${JSON.stringify(recognitionResults)}
            
            Compare these analyses and compute the accuracy scores as described.`
          }
        ]
      })
    });
    
    const result = await response.json();
    const accuracyScores = JSON.parse(result.choices[0].message.content);
    
    await logProcessStep(imageId, 'compute_accuracy_complete', { accuracyScores });
    return accuracyScores;
  } catch (error) {
    await logProcessStep(imageId, 'compute_accuracy_error', { error: error.message });
    throw new Error(`Computing accuracy scores failed: ${error.message}`);
  }
}

// Format and combine all results
function formatResult(aiAnalysis: any, accuracyScores: any): any {
  // Combine the AI analysis with the accuracy scores
  return {
    title: aiAnalysis.title,
    description: aiAnalysis.description,
    date: aiAnalysis.date,
    year: aiAnalysis.year,
    address: aiAnalysis.address,
    gps: aiAnalysis.gps,
    is_historical: aiAnalysis.is_historical,
    is_ai_generated: aiAnalysis.is_ai_generated,
    is_mature_content: aiAnalysis.is_mature_content,
    ...accuracyScores
  };
}

// Store to Supabase databases
async function storeToSupabase(result: any, imageId: string, imageUrl: string) {
  try {
    await logProcessStep(imageId, 'store_to_supabase_start', { result });
    
    // Store to Pilot DB
    const pilotData = {
      id: imageId,
      image_url: imageUrl,
      ...result
    };
    
    const { error: pilotError } = await pilotClient
      .from('image_metadata')
      .upsert(pilotData);
    
    if (pilotError) {
      throw new Error(`Error storing to Pilot DB: ${pilotError.message}`);
    }
    
    // Store to Guess-History DB
    const guessHistoryData = {
      id: imageId,
      image_url: imageUrl,
      ...result
    };
    
    const { error: guessHistoryError } = await guessHistoryClient
      .from('image_analysis')
      .upsert(guessHistoryData);
    
    if (guessHistoryError) {
      throw new Error(`Error storing to Guess-History DB: ${guessHistoryError.message}`);
    }
    
    await logProcessStep(imageId, 'store_to_supabase_complete', { databases: ['pilot', 'guess-history'] });
    return { pilotData, guessHistoryData };
  } catch (error) {
    await logProcessStep(imageId, 'store_to_supabase_error', { error: error.message });
    throw new Error(`Storing to Supabase failed: ${error.message}`);
  }
}

// Retry logic for low accuracy scores
async function retryIfLowAccuracy(result: any, imageUrl: string, imageId: string): Promise<any> {
  const lowAccuracyFields = Object.entries(result)
    .filter(([key, value]) => key.startsWith('accuracy_') && (value as number) < 0.6)
    .map(([key]) => key);
  
  if (lowAccuracyFields.length === 0) {
    return result;
  }
  
  await logProcessStep(imageId, 'retry_for_low_accuracy', { 
    lowAccuracyFields,
    imageUrl 
  });
  
  // For simplicity, we'll just run the entire process again
  // In a real implementation, you might want to only retry the specific low accuracy fields
  const aiAnalysis = await runAIInference(imageUrl, imageId);
  const recognitionResults = await runImageRecognition(imageUrl, imageId);
  const accuracyScores = await computeAccuracyScores(aiAnalysis, recognitionResults, imageId);
  return formatResult(aiAnalysis, accuracyScores);
}

// Main handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { imageUrl, imageId } = await req.json();
    
    if (!imageUrl || !imageId) {
      return new Response(
        JSON.stringify({ error: 'imageUrl and imageId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // 1. Run AI inference
    const aiAnalysis = await runAIInference(imageUrl, imageId);
    
    // 2. Run Image Recognition
    const recognitionResults = await runImageRecognition(imageUrl, imageId);
    
    // 3. Compare both outputs and compute accuracy scores
    const accuracyScores = await computeAccuracyScores(aiAnalysis, recognitionResults, imageId);
    
    // 4. Format result
    let result = formatResult(aiAnalysis, accuracyScores);
    
    // 5. Retry if any accuracy score is below 0.6
    result = await retryIfLowAccuracy(result, imageUrl, imageId);
    
    // 6. Store to Supabase
    await storeToSupabase(result, imageId, imageUrl);
    
    // Return the final result
    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Error processing image metadata:", error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred while processing the image metadata' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
