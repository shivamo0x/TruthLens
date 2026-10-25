import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, ExternalLink, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API}/history`);
      setHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrustColor = (score) => {
    if (score >= 70) return 'text-green-600 dark:text-green-400';
    if (score >= 40) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const getBiasColor = (level) => {
    if (level <= 30) return 'bg-emerald-500';
    if (level <= 60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Button
            data-testid="back-to-home-button"
            variant="ghost"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </Button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6" />
            <span className="font-serif font-bold text-xl">TruthLens</span>
          </div>
          <div className="w-20" />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-3">
            Analysis History
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Your last 10 credibility checks
          </p>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <Card data-testid="empty-history-card" className="text-center py-12">
              <CardContent>
                <p className="text-muted-foreground mb-4">No analysis history yet</p>
                <Button onClick={() => navigate('/')}>Analyze Your First Article</Button>
              </CardContent>
            </Card>
          ) : (
            <div data-testid="history-list" className="space-y-4">
              {history.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    data-testid={`history-item-${index}`}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/analysis/${item.id}`, { state: { analysis: item } })}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-xl font-serif mb-2">
                            {item.headline || 'Text Analysis'}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(item.timestamp), 'MMM dd, yyyy HH:mm')}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className={`text-3xl font-bold font-mono ${getTrustColor(item.trust_score)}`}>
                            {item.trust_score}
                          </div>
                          <span className="text-xs text-muted-foreground">Trust Score</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex-1">
                          <div className="text-xs text-muted-foreground mb-1">Bias Level</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full ${getBiasColor(item.bias_level)} transition-all`}
                                style={{ width: `${item.bias_level}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono">{item.bias_level}%</span>
                          </div>
                        </div>
                        <Badge variant="outline">{item.bias_label}</Badge>
                      </div>
                      {item.input_type === 'url' && (
                        <a
                          href={item.original_content}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Source
                        </a>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}