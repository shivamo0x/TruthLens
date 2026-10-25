import { motion } from 'framer-motion';

export default function NutritionLabel({ analysis }) {
  const getTrustColor = (score) => {
    if (score >= 70) return '#34C759';
    if (score >= 40) return '#FF9500';
    return '#FF3B30';
  };

  const getBiasPosition = (level) => {
    return `${level}%`;
  };

  const findings = analysis.key_findings || [];
  const highlights = analysis.highlights || [];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="nutrition-label bg-card p-6 rounded-lg"
      data-testid="nutrition-label"
    >
      <div className="border-b-4 border-black pb-2 mb-4">
        <h2 className="text-3xl font-black font-sans tracking-tighter">
          Credibility Facts
        </h2>
      </div>

      <div className="space-y-6">
        <div data-testid="trust-score-section" className="border-b-2 border-black pb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
                Trust Score
              </div>
              <div className="flex items-center gap-2">
                <span className="text-5xl font-black font-mono" style={{ color: getTrustColor(analysis.trust_score) }}>
                  {analysis.trust_score}
                </span>
                <span className="text-xl text-muted-foreground">/100</span>
              </div>
            </div>
            <div className="w-24 h-24 relative">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#E5E5EA"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={getTrustColor(analysis.trust_score)}
                  strokeWidth="8"
                  strokeDasharray={`${analysis.trust_score * 2.513} 251.3`}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        <div data-testid="bias-meter-section" className="border-b border-gray-300 pb-4">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
            Bias Meter
          </div>
          <div className="space-y-2">
            <div className="relative h-3 bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 rounded-full overflow-hidden">
              <div
                className="absolute top-0 w-1 h-full bg-black"
                style={{ left: getBiasPosition(analysis.bias_level) }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Objective</span>
              <span className="font-semibold text-foreground">{analysis.bias_label}</span>
              <span>Inflammatory</span>
            </div>
          </div>
        </div>

        <div data-testid="key-findings-section" className="border-b border-gray-300 pb-4">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
            Key Findings
          </div>
          <ul className="space-y-2">
            {findings.length > 0 && findings.map((finding, idx) => {
              return (
                <li key={idx} data-testid={`finding-${idx}`} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{finding}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div data-testid="credibility-notes-section">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
            Assessment
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {analysis.credibility_notes}
          </p>
        </div>

        {highlights.length > 0 && (
          <div data-testid="highlights-legend-section" className="border-t-2 border-black pt-4">
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
              Highlight Legend
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-200 border-b-2 border-green-600 rounded" />
                <span>Factual Content</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-amber-200 border-b-2 border-amber-600 rounded" />
                <span>Neutral/Opinion</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-rose-200 border-b-2 border-rose-600 rounded" />
                <span>Manipulative Language</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
