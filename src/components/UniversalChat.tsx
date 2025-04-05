
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Send, Loader2 } from 'lucide-react';
import { getChatMessages, sendChatMessage } from '@/lib/chatService';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  sender: string;
  recipient: string;
  message: string;
  timestamp: string;
  context_id: string;
}

const UniversalChat: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [contextId, setContextId] = useState('universal-context');
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Load messages for the current context
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true);
        const { data, error } = await getChatMessages(contextId);
        if (error) throw error;
        if (data) setMessages(data);
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadMessages();
  }, [contextId]);
  
  // Scroll to bottom of message container when messages update
  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);
  
  const fetchAIResponse = async (userMessage: string) => {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` // This should use an edge function in production
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are Pilot, the central AI of an autonomous agent system. Respond as if you are managing a team of AI agents and coordinating with the human Leader. Your responses should be helpful, concise, and focused on the task at hand.'
            },
            {
              role: 'user',
              content: userMessage
            }
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.choices[0].message.content;
      
    } catch (error) {
      console.error('Error fetching AI response:', error);
      return "I'm having trouble connecting to my reasoning capabilities. Please try again or check with the system administrator.";
    }
  };
  
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    setLoading(true);
    try {
      // Send user message
      const { data: userMsgData, error: userMsgError } = await sendChatMessage({
        sender: 'Leader',
        recipient: 'Pilot',
        message: newMessage,
        context_id: contextId
      });
      
      if (userMsgError) throw userMsgError;
      
      if (userMsgData) {
        // Update the local state with the user message
        setMessages(prev => [...prev, userMsgData]);
        setNewMessage('');
        
        // Get AI response
        const aiResponseText = await fetchAIResponse(newMessage);
        
        // Send AI message to database
        const { data: aiMsgData, error: aiMsgError } = await sendChatMessage({
          sender: 'Pilot',
          recipient: 'Leader',
          message: aiResponseText,
          context_id: contextId
        });
        
        if (aiMsgError) throw aiMsgError;
        
        if (aiMsgData) {
          // Update the local state with the AI message
          setMessages(prev => [...prev, aiMsgData]);
        }
      }
    } catch (error) {
      console.error('Error in chat exchange:', error);
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
    <div className="fixed bottom-0 right-2 z-10 w-96">
      <Card className={`shadow-lg transition-all ${isExpanded ? 'h-[500px]' : 'h-14'}`}>
        <div 
          className="h-14 flex items-center justify-between px-4 cursor-pointer border-b"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="font-medium flex items-center gap-2">
            {loading && isExpanded && <Loader2 className="h-4 w-4 animate-spin" />}
            Pilot AI Assistant
          </div>
          <Button variant="ghost" size="sm">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
        
        {isExpanded && (
          <>
            <CardContent className="overflow-y-auto h-[calc(100%-7rem)] p-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground h-full flex items-center justify-center">
                  Start a conversation with Pilot AI.
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map(renderMessage)}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </CardContent>
            
            <CardFooter className="pt-2 pb-4 px-4">
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
                  disabled={loading}
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={loading || !newMessage.trim()}
                  className="flex gap-2 items-center"
                  size="sm"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                </Button>
              </div>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
};

export default UniversalChat;
