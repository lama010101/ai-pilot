
import { supabase } from './supabaseClient';
import { USE_FAKE_AUTH } from './supabaseClient';
import { generateId } from './supabase/utils';

// Types for chat messages
export interface ChatMessageDB {
  id: string;
  sender: string;
  recipient: string;
  message: string;
  timestamp: string;
  context_id: string;
  vector?: any; // Vector embedding (if implemented)
}

// Mock data for development/testing
let mockChatMessages: ChatMessageDB[] = [];

// Get chat messages by context_id
export async function getChatMessages(contextId: string) {
  if (USE_FAKE_AUTH) {
    return { 
      data: mockChatMessages
        .filter(msg => msg.context_id === contextId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
      error: null 
    };
  }
  
  return await supabase
    .from('chat_messages')
    .select('*')
    .eq('context_id', contextId)
    .order('timestamp');
}

// Send a new chat message
export async function sendChatMessage(message: Omit<ChatMessageDB, 'id' | 'timestamp' | 'vector'>) {
  const newMessage: ChatMessageDB = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    ...message,
  };
  
  if (USE_FAKE_AUTH) {
    mockChatMessages.push(newMessage);
    return { data: newMessage, error: null };
  }
  
  // In a real implementation, you might compute and add vector embeddings here
  // This would require an API call to OpenAI or similar service
  
  return await supabase
    .from('chat_messages')
    .insert(newMessage)
    .select()
    .single();
}

// Initialize the chat_messages table in Supabase
export async function initializeChatTable() {
  if (USE_FAKE_AUTH) {
    console.log("Skipping chat table initialization in fake auth mode");
    return { success: true };
  }
  
  try {
    // Note: This is a simplified approach. In a production environment,
    // you would typically use Supabase migrations or the Supabase UI to create tables
    
    // Enable the vector extension if not already enabled
    await supabase.rpc('extensions', {
      command: 'create extension if not exists vector'
    });
    
    // Create the chat_messages table if it doesn't exist
    const { error } = await supabase.rpc('create_table_if_not_exists', {
      table_name: 'chat_messages',
      table_definition: `
        id uuid primary key default gen_random_uuid(),
        sender text not null,
        recipient text not null,
        message text not null,
        timestamp timestamptz default now(),
        context_id uuid default gen_random_uuid(),
        vector vector(1536)
      `
    });
    
    if (error) {
      console.error("Error creating chat_messages table:", error);
      return { success: false, error };
    }
    
    // Enable realtime on the chat_messages table
    // This would typically be done in the Supabase dashboard
    
    return { success: true };
  } catch (error) {
    console.error("Error initializing chat table:", error);
    return { success: false, error };
  }
}
