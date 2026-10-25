import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, History, Moon, Sun, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function LandingPage() {
  const [inputType, setInputType] = useState('url');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const handleAnalyze = async () => {
    if (!content.trim()) {
      toast.error('Please enter a URL or text to analyze');
      return;
    }

    if (inputType === 'url' && !content.startsWith('http')) {
      toast.error('Please enter a valid URL starting with http:// or https://');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/analyze`, {
        input_type: inputType,
        content: content
      });

      toast.success('Analysis complete!');
      navigate(`/analysis/${response.data.id}`, { state: { analysis: response.data } });
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(error.response?.data?.detail || 'Failed to analyze content');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero relative">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      
      <div className="relative z-10">
        <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <ShieldCheck className="w-8 h-8" />
            <h1 className="text-2xl font-serif font-bold">TruthLens</h1>
          </motion.div>
          
          <div className="flex gap-3">
            <Button
              data-testid="history-nav-button"
              variant="outline"
              size="icon"
              onClick={() => navigate('/history')}
            >
              <History className="w-5 h-5" />
            </Button>
            <Button
              data-testid="theme-toggle-button"
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </div>
        </nav>

        <div className="flex items-center justify-center min-h-[calc(100vh-100px)] px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-3xl"
          >
            <div className="glass-card rounded-3xl p-8 md:p-12 shadow-2xl">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center mb-8"
              >
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold tracking-tight mb-4">
                  Decode the Truth
                </h2>
                <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                  AI-powered analysis of news credibility, emotional bias, and clickbait potential
                </p>
              </motion.div>

              <Tabs defaultValue="url" className="w-full" onValueChange={setInputType}>
                <TabsList data-testid="input-type-tabs" className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger data-testid="url-tab" value="url">URL</TabsTrigger>
                  <TabsTrigger data-testid="text-tab" value="text">Text</TabsTrigger>
                </TabsList>
                
                <TabsContent value="url" className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      data-testid="url-input"
                      type="url"
                      placeholder="Paste news article URL here..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full h-16 pl-12 pr-4 text-lg rounded-full border-2 border-border bg-card focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="text" className="space-y-4">
                  <Textarea
                    data-testid="text-input"
                    placeholder="Paste article text or headline here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[200px] text-base border-2 resize-none"
                  />
                </TabsContent>
              </Tabs>

              <Button
                data-testid="analyze-button"
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full h-14 text-lg font-semibold rounded-full mt-6 transition-all"
                size="lg"
              >
                {loading ? 'Analyzing...' : 'Analyze Now'}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}