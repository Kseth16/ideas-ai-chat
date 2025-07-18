import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const ChatContainer = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm the 26ideas FAQ Assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const typeMessage = (text: string) => {
    return new Promise<void>((resolve) => {
      const messageId = Date.now().toString();
      const newMessage: Message = {
        id: messageId,
        text: '',
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      let currentText = '';
      let currentIndex = 0;
      
      const typeInterval = setInterval(() => {
        if (currentIndex < text.length) {
          currentText += text[currentIndex];
          setMessages(prev => 
            prev.map(msg => 
              msg.id === messageId 
                ? { ...msg, text: currentText }
                : msg
            )
          );
          currentIndex++;
        } else {
          clearInterval(typeInterval);
          setIsTyping(false);
          resolve();
        }
      }, 30);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:3000/chat', {
        // Production: https://thinkificbackend.onrender.com/chat
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      await typeMessage(data.reply || 'Sorry, I could not process your request.');
    } catch (error) {
      setIsTyping(false);
      toast({
        title: "Connection Error",
        description: "Could not connect to the server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[600px] bg-background rounded-lg shadow-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-navy-primary text-white p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-accent rounded-full flex items-center justify-center">
          <MessageCircle className="w-6 h-6 text-navy-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">26ideas FAQ Assistant</h3>
          <p className="text-sm text-blue-accent">Ask me anything about our services</p>
        </div>
        <a 
          href="https://26ideas.com" 
          target="_parent"
          className="text-xs text-blue-accent hover:text-white transition-colors"
        >
          Visit 26ideas.com
        </a>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-navy-primary text-white'
                  : 'bg-white text-navy-primary border border-gray-200'
              }`}
            >
              <p className="text-sm leading-relaxed">{message.text}</p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white text-navy-primary border border-gray-200 px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-accent rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-accent rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 border-gray-300 focus:border-blue-accent focus:ring-blue-accent"
          />
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="bg-navy-primary hover:bg-navy-secondary text-white px-6"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatContainer;