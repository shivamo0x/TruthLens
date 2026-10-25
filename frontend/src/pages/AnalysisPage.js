import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NutritionLabel from '@/components/NutritionLabel';
import ArticleContent from '@/components/ArticleContent';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AnalysisPage() {

  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [analysis, setAnalysis] = useState(location.state?.analysis || null);
  const [loading, setLoading] = useState(!location.state?.analysis);

  useEffect(() => {
    if (!analysis && id) {
      fetchAnalysis();
    }
  }, [id]);

  const fetchAnalysis = async () => {
    try {

      const response = await axios.get(`${API}/history`);
      const found = response.data.find(a => a.id === id);

      if (found) {
        setAnalysis(found);
      }

    } catch (error) {
      console.error('Failed to fetch analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">

        <div className="text-center">

          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>

          <p className="text-muted-foreground">
            Loading analysis...
          </p>

        </div>

      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">

        <div className="text-center">

          <p className="text-xl mb-4">
            Analysis not found
          </p>

          <Button onClick={() => navigate('/')}>
            Go Home
          </Button>

        </div>

      </div>
    );
  }

  return (

    <div className="min-h-screen bg-background">

      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">

        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">

          <Button
            data-testid="back-button"
            variant="ghost"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            New Analysis
          </Button>

          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6" />
            <span className="font-serif font-bold text-xl">
              TruthLens
            </span>
          </div>

          <Button
            data-testid="history-button"
            variant="outline"
            onClick={() => navigate('/history')}
          >
            History
          </Button>

        </div>

      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">

        <div className="grid lg:grid-cols-2 gap-8">

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >

            {analysis.headline && (

              <div
                data-testid="article-headline"
                className="mb-6"
              >

                <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight mb-3">
                  {analysis.headline}
                </h1>

                {analysis.input_type === 'url' && (

                  <a
                    data-testid="source-link"
                    href={analysis.original_content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
                  >

                    View Source
                    <ExternalLink className="w-3 h-3" />

                  </a>

                )}

              </div>

            )}

            {/* Content + Fact Check */}
            <ArticleContent analysis={analysis} />

          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:sticky lg:top-24 h-fit"
          >

            <NutritionLabel analysis={analysis} />

          </motion.div>

        </div>

      </div>

    </div>

  );
}