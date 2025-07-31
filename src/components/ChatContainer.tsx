import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, FileText } from 'lucide-react';
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
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    text: "Hello! I'm here to help answer your questions and have a conversation about anything you'd like to know. What would you like to discuss?",
    sender: 'bot',
    timestamp: new Date()
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    toast
  } = useToast();
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  const typeMessage = (text: string) => {
    return new Promise<void>(resolve => {
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
          setMessages(prev => prev.map(msg => msg.id === messageId ? {
            ...msg,
            text: currentText
          } : msg));
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
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: input
        })
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
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handlePdfSubmit = async () => {
    setIsPdfLoading(true);
    try {
      // Hit test URL
      await fetch('https://httpbin.org/delay/1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          test: 'pdf generation'
        })
      });

      // Wait 5 seconds for loading effect
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Create empty PDF blob and display it
      const pdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF';
      const blob = new Blob([pdfContent], {
        type: 'application/pdf'
      });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      toast({
        title: "PDF Error",
        description: "Could not generate PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsPdfLoading(false);
    }
  };

  const downloadPdf = () => {
    if (pdfUrl) {
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = 'conversation.pdf';
      a.click();
    }
  };
  if (pdfUrl) {
    return (
      <div className="flex flex-col h-full max-h-[600px] bg-background rounded-lg shadow-lg border border-border overflow-hidden">
        {/* Header */}
        <div className="bg-navy-primary text-white p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-accent rounded-full flex items-center justify-center">
            <FileText className="w-6 h-6 text-navy-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Generated PDF</h3>
          </div>
          <Button 
            onClick={downloadPdf}
            variant="secondary"
            size="sm"
            className="bg-blue-accent hover:bg-blue-accent/90 text-navy-primary"
          >
            Download PDF
          </Button>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden">
          <iframe
            src={pdfUrl}
            className="w-full h-full border-0"
            title="Generated PDF"
          />
        </div>
      </div>
    );
  }

  return <div className="flex flex-col h-full max-h-[600px] bg-background rounded-lg shadow-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-navy-primary text-white p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-accent rounded-full flex items-center justify-center">
          <MessageCircle className="w-6 h-6 text-navy-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">26ideas Narrative Compiler</h3>
          
        </div>
        
      </div>

      {/* Messages */}
      

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200 space-y-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          
          
        </form>
        
        {/* PDF Submit Button */}
        <div className="flex justify-center">
          <Button onClick={handlePdfSubmit} disabled={isPdfLoading} className="bg-blue-accent hover:bg-blue-accent/90 text-navy-primary mx-0 px-[24px]">
            {isPdfLoading ? <>
                <div className="w-4 h-4 border-2 border-navy-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                Generating PDF...
              </> : <>
                <FileText className="w-4 h-4 mr-2" />
                Generate PDF
              </>}
          </Button>
        </div>
      </div>
    </div>;
};
export default ChatContainer;