
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LEADER_EMAIL } from '@/lib/supabaseClient';
import { getChatMessages, sendChatMessage } from '@/lib/chatService';

interface Message {
  id: string;
  sender: string;
  recipient: string;
  message: string;
  timestamp: string;
}

const Chat: React.FC = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [contextId, setContextId] = useState('default-context');
  const [loading, setLoading] = useState(false);
  
  // Load messages for the current context
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const { data, error } = await getChatMessages(contextId);
        if (error) throw error;
        if (data) setMessages(data);
      } catch (error) {
        console.error('Error loading messages:', error);
        toast({
          title: "Error",
          description: "Failed to load chat messages",
          variant: "destructive"
        });
      }
    };
    
    loadMessages();
    
    // In a real implementation, you would set up a Supabase subscription here
    // to listen for new messages in real-time
    
  }, [contextId]);
  
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    setLoading(true);
    try {
      const { data, error } = await sendChatMessage({
        sender: 'Leader', // The Leader is always the sender in this UI
        recipient: 'Pilot', // Default recipient, could be made dynamic
        message: newMessage,
        context_id: contextId
      });
      
      if (error) throw error;
      
      if (data) {
        // Update the local state with the new message
        setMessages(prev => [...prev, data]);
        setNewMessage('');
        
        // In a real implementation, you would add code here to:
        // 1. Trigger the AI to generate a response
        // 2. Listen for the AI's response via Supabase Realtime
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Render message bubbles based on sender
  const renderMessage = (message: Message) => {
    const isLeader = message.sender === 'Leader';
    
    return (
      <div 
        key={message.id} 
        className={`flex ${isLeader ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div 
          className={`rounded-lg px-4 py-2 max-w-[80%] ${
            isLeader 
              ? 'bg-pilot-600 text-white' 
              : 'bg-gray-100 dark:bg-gray-800 text-foreground'
          }`}
        >
          <div className="text-sm font-medium mb-1">{message.sender}</div>
          <div className="whitespace-pre-wrap">{message.message}</div>
          <div className="text-xs mt-1 opacity-70">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <>
      <Helmet>
        <title>Chat | AI Pilot</title>
      </Helmet>
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Leader ↔ AI Chat</h1>
          <p className="text-muted-foreground">
            Communicate directly with AI agents
          </p>
        </div>
        
        <Card className="h-[calc(100vh-12rem)]">
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
            <CardDescription>
              Chat context: {contextId}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="overflow-y-auto h-[calc(100%-10rem)]">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map(renderMessage)
            )}
          </CardContent>
          
          <Separator />
          
          <CardFooter className="pt-4">
            <div className="flex w-full gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={loading || !newMessage.trim()}
              >
                Send
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};

export default Chat;
