import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function ArticleContent({ analysis }) {

  const highlights = analysis.highlights || [];

  const getHighlightClass = (type) => {
    if (type === 'factual') return 'highlight-factual';
    if (type === 'manipulative') return 'highlight-manipulative';
    return 'highlight-neutral';
  };

  const getTypeColor = (type) => {
    if (type === 'factual') return 'bg-green-500';
    if (type === 'manipulative') return 'bg-rose-500';
    return 'bg-amber-500';
  };

  return (
    <div className="space-y-6">

      <Card data-testid="article-content-card">

        <CardHeader>
          <CardTitle className="font-serif">Content Analysis</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">

          {analysis.input_type === 'text' && (
            <div data-testid="original-text-section" className="space-y-2">

              <h3 className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
                Original Text
              </h3>

              <p className="text-sm leading-relaxed">
                {analysis.original_content}
              </p>

              <Separator className="my-4" />

            </div>
          )}

          <div>

            <h3 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-4">
              Highlighted Excerpts
            </h3>

            {highlights.length === 0 ? (

              <div data-testid="no-highlights" className="text-muted-foreground italic">
                No specific highlights identified in this analysis.
              </div>

            ) : (

              <div data-testid="highlights-section" className="space-y-4">

                {highlights.map((highlight, idx) => {

                  return (

                    <div key={idx} data-testid={`highlight-${idx}`} className="space-y-2">

                      <div className="flex items-center gap-2 mb-2">

                        <Badge className={getTypeColor(highlight.type)}>
                          {highlight.type}
                        </Badge>

                      </div>

                      <div className={`p-3 rounded-md ${getHighlightClass(highlight.type)}`}>

                        <p className="text-sm font-medium mb-1">
                          "{highlight.text}"
                        </p>

                      </div>

                      <p className="text-sm text-muted-foreground pl-3">
                        {highlight.explanation}
                      </p>

                    </div>

                  );

                })}

              </div>

            )}

          </div>

        </CardContent>

      </Card>

      {/* ================= FACT CHECK UI ================= */}

      {analysis.fact_check && (

        <Card className="bg-muted/40">

          <CardHeader>

            <CardTitle className="text-lg">
              Fact Check Result
            </CardTitle>

          </CardHeader>

          <CardContent>

            <p className="text-sm leading-relaxed mb-3">
              {analysis.fact_check.message}
            </p>

            {analysis.fact_check.fact_checked && (
              <div className="space-y-1 text-sm">
                <p><strong>Publisher:</strong> {analysis.fact_check.publisher || 'Unknown'}</p>
                <p><strong>Rating:</strong> {analysis.fact_check.rating || 'Not provided'}</p>
              </div>
            )}

          </CardContent>

        </Card>

      )}

      {/* ================= END FACT CHECK UI ================= */}

    </div>
  );
}
