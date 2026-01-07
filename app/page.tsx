'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Key, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  BookOpen,
  Sparkles,
  Database,
  Zap
} from 'lucide-react';

interface ProgressState {
  phase: 'idle' | 'searching' | 'generating' | 'complete' | 'error';
  page: number;
  totalPapers: number;
  message: string;
  latestPaper: string;
}

interface CompleteData {
  filename: string;
  totalPapers: number;
}

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [keyword, setKeyword] = useState('');
  const [progress, setProgress] = useState<ProgressState>({
    phase: 'idle',
    page: 0,
    totalPapers: 0,
    message: '',
    latestPaper: '',
  });
  const [csvData, setCsvData] = useState<CompleteData | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [maxPapers, setMaxPapers] = useState(100);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const paperLimitOptions = [100, 250, 500, 1000, 2500];

  useEffect(() => {
    setMounted(true);
  }, []);

  const startScraping = useCallback(async () => {
    if (!apiKey.trim() || !keyword.trim()) return;

    setCsvData(null);
    setProgress({
      phase: 'searching',
      page: 0,
      totalPapers: 0,
      message: 'Initializing...',
      latestPaper: '',
    });

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, keyword, maxResults: maxPapers }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let eventType = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7);
          } else if (line.startsWith('data: ') && eventType) {
            try {
              const data = JSON.parse(line.slice(6));
              
              switch (eventType) {
                case 'status':
                  setProgress((prev) => ({
                    ...prev,
                    message: data.message,
                    phase: data.phase === 'complete' ? 'complete' : 
                           data.phase === 'generating' ? 'generating' : prev.phase,
                  }));
                  break;
                case 'progress':
                  setProgress((prev) => ({
                    ...prev,
                    page: data.page,
                    totalPapers: data.totalPapers,
                    message: data.message,
                  }));
                  break;
                case 'papers':
                  setProgress((prev) => ({
                    ...prev,
                    totalPapers: data.totalPapers,
                    latestPaper: data.latestPaper,
                  }));
                  break;
                case 'complete':
                  setProgress((prev) => ({
                    ...prev,
                    phase: 'complete',
                    totalPapers: data.totalPapers,
                    message: data.totalPapers > 0 
                      ? `Successfully scraped ${data.totalPapers} papers!`
                      : 'No papers found for this search query.',
                  }));
                  if (data.filename && data.totalPapers > 0) {
                    setCsvData({
                      filename: data.filename,
                      totalPapers: data.totalPapers,
                    });
                  }
                  break;
                case 'error':
                  setProgress((prev) => ({
                    ...prev,
                    phase: 'error',
                    message: data.message,
                  }));
                  break;
              }
            } catch {
              // Skip malformed JSON
            }
            eventType = '';
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setProgress((prev) => ({
          ...prev,
          phase: 'error',
          message: `Error: ${(error as Error).message}`,
        }));
      }
    }
  }, [apiKey, keyword, maxPapers]);

  const downloadCsv = useCallback(() => {
    if (!csvData) return;
    window.location.href = `/api/download?file=${encodeURIComponent(csvData.filename)}`;
  }, [csvData]);

  const isSearching = progress.phase === 'searching' || progress.phase === 'generating';

  return (
    <main className="min-h-screen noise-bg grid-pattern relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {mounted && [...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-scholar-accent rounded-full animate-pulse-glow"
            style={{
              left: `${10 + (i * 6)}%`,
              top: `${20 + (i * 5) % 60}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${3 + i * 0.3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className={`text-center mb-12 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-scholar-accent-dim border border-scholar-accent/20 mb-6">
            <Sparkles className="w-4 h-4 text-scholar-accent" />
            <span className="text-sm font-mono text-scholar-accent">Google Scholar API</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-mono font-bold text-scholar-text mb-4">
            <span className="text-glow text-scholar-accent">Scholar</span> Sky
          </h1>
          
          {/* <p className="text-scholar-muted text-lg max-w-2xl mx-auto">
            Extract up to 1,000 research papers from Google Scholar with beautiful progress visualization
          </p> */}
        </div>

        {/* Main Card */}
        <div className={`bg-scholar-card/80 backdrop-blur-xl rounded-2xl border border-scholar-border p-8 relative overflow-hidden transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          {/* Card glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-scholar-accent/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="relative space-y-6">
            {/* API Key Input */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-mono text-scholar-text">
                <Key className="w-4 h-4 text-scholar-accent" />
                SerpAPI Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your SerpAPI key"
                  className="w-full bg-scholar-bg/50 border border-scholar-border rounded-xl px-4 py-3 text-scholar-text placeholder-scholar-muted focus:outline-none focus:border-scholar-accent/50 focus:ring-1 focus:ring-scholar-accent/30 transition-all font-mono text-sm"
                  disabled={isSearching}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-scholar-muted hover:text-scholar-accent transition-colors text-xs font-mono"
                >
                  {showApiKey ? 'Hide' : 'Show'}
                </button>
              </div>
              <a
                href="https://serpapi.com/google-scholar-api"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-scholar-muted hover:text-scholar-accent transition-colors"
              >
                Get your API key <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Keyword Input */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-mono text-scholar-text">
                <Search className="w-4 h-4 text-scholar-accent" />
                Search Keyword
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder='e.g., perturb-seq or machine learning'
                className="w-full bg-scholar-bg/50 border border-scholar-border rounded-xl px-4 py-3 text-scholar-text placeholder-scholar-muted focus:outline-none focus:border-scholar-accent/50 focus:ring-1 focus:ring-scholar-accent/30 transition-all font-mono text-sm"
                disabled={isSearching}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isSearching) {
                    startScraping();
                  }
                }}
              />
            </div>

            {/* Paper Limit Selector */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-mono text-scholar-text">
                <FileText className="w-4 h-4 text-scholar-accent" />
                Number of Papers
              </label>
              <div className="flex gap-2 flex-wrap">
                {paperLimitOptions.map((limit) => (
                  <button
                    key={limit}
                    type="button"
                    onClick={() => setMaxPapers(limit)}
                    disabled={isSearching}
                    className={`px-4 py-2 rounded-lg font-mono text-sm transition-all disabled:opacity-50 ${
                      maxPapers === limit
                        ? 'bg-scholar-accent text-scholar-bg glow-accent'
                        : 'bg-scholar-bg/50 border border-scholar-border text-scholar-muted hover:border-scholar-accent/50 hover:text-scholar-text'
                    }`}
                  >
                    {limit.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Button */}
            <button
              onClick={startScraping}
              disabled={isSearching || !apiKey.trim() || !keyword.trim()}
              className="w-full py-4 rounded-xl font-mono font-bold text-sm uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-scholar-accent text-scholar-bg hover:bg-scholar-accent/90 hover:scale-[1.02] active:scale-[0.98] glow-accent"
            >
              {isSearching ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Scraping...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Zap className="w-5 h-5" />
                  Start Scraping
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Progress Section */}
        {progress.phase !== 'idle' && (
          <div className="mt-8 animate-fade-in">
            <div className="bg-scholar-card/80 backdrop-blur-xl rounded-2xl border border-scholar-border p-6 relative overflow-hidden">
              {/* Scanning effect while searching */}
              {isSearching && (
                <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-scholar-accent to-transparent animate-scan" />
              )}

              {/* Status Header */}
              <div className="flex items-center gap-3 mb-6">
                {progress.phase === 'searching' && (
                  <div className="w-10 h-10 rounded-xl bg-scholar-accent-dim flex items-center justify-center">
                    <Database className="w-5 h-5 text-scholar-accent animate-pulse" />
                  </div>
                )}
                {progress.phase === 'generating' && (
                  <div className="w-10 h-10 rounded-xl bg-scholar-accent-dim flex items-center justify-center">
                    <FileText className="w-5 h-5 text-scholar-accent animate-pulse" />
                  </div>
                )}
                {progress.phase === 'complete' && (
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center animate-scale-in">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  </div>
                )}
                {progress.phase === 'error' && (
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  </div>
                )}
                
                <div>
                  <h3 className="font-mono font-bold text-scholar-text">
                    {progress.phase === 'searching' && 'Searching Google Scholar'}
                    {progress.phase === 'generating' && 'Generating CSV'}
                    {progress.phase === 'complete' && 'Complete!'}
                    {progress.phase === 'error' && 'Error'}
                  </h3>
                  <p className="text-sm text-scholar-muted">{progress.message}</p>
                </div>
              </div>

              {/* Progress Stats */}
              {(progress.phase === 'searching' || progress.phase === 'generating' || progress.phase === 'complete') && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-scholar-bg/50 rounded-xl p-4 border border-scholar-border">
                    <div className="text-2xl font-mono font-bold text-scholar-accent mb-1">
                      {progress.page}
                    </div>
                    <div className="text-xs text-scholar-muted uppercase tracking-wider">
                      Pages Fetched
                    </div>
                  </div>
                  <div className="bg-scholar-bg/50 rounded-xl p-4 border border-scholar-border">
                    <div className="text-2xl font-mono font-bold text-scholar-accent mb-1 transition-all">
                      {progress.totalPapers}
                    </div>
                    <div className="text-xs text-scholar-muted uppercase tracking-wider">
                      Papers Found
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              {isSearching && (
                <div className="mb-6">
                  <div className="h-2 bg-scholar-bg rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-scholar-accent/50 to-scholar-accent relative transition-all duration-500"
                      style={{ width: `${Math.min((progress.page / (maxPapers / 10)) * 100, 100)}%` }}
                    >
                      <div className="absolute inset-0 progress-shimmer" />
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-scholar-muted font-mono">
                    <span>Page {progress.page} of ~{Math.ceil(maxPapers / 10)}</span>
                    <span>Max {maxPapers.toLocaleString()} papers</span>
                  </div>
                </div>
              )}

              {/* Latest Paper */}
              {progress.latestPaper && isSearching && (
                <div className="bg-scholar-bg/50 rounded-xl p-4 border border-scholar-border animate-fade-in">
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-4 h-4 text-scholar-accent mt-1 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs text-scholar-muted uppercase tracking-wider mb-1">
                        Latest Paper
                      </div>
                      <p className="text-sm text-scholar-text truncate font-mono">
                        {progress.latestPaper}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Download Button */}
              {csvData && csvData.totalPapers > 0 && (
                <div className="mt-6 animate-fade-in">
                  <button
                    onClick={downloadCsv}
                    className="w-full py-4 rounded-xl font-mono font-bold text-sm uppercase tracking-wider bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download {csvData.filename}
                  </button>
                  <p className="text-center text-xs text-scholar-muted mt-2">
                    {csvData.totalPapers} papers • CSV format
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Cards */}
        <div className={`mt-12 grid md:grid-cols-3 gap-4 transition-all duration-700 delay-400 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          {[
            { icon: Key, title: 'Free API Key', desc: 'Get your free SerpAPI key' },
            { icon: Database, title: 'Up to 2,500 papers', desc: 'Per month with free API key' },
            { icon: FileText, title: 'CSV Export', desc: 'Download with all metadata' },
          ].map(({ icon: Icon, title, desc }, i) => (
            <div
              key={title}
              className="bg-scholar-card/50 backdrop-blur-sm rounded-xl p-4 border border-scholar-border/50 transition-all duration-700"
              style={{ transitionDelay: `${500 + i * 100}ms` }}
            >
              <Icon className="w-5 h-5 text-scholar-accent mb-2" />
              <h3 className="font-mono font-bold text-sm text-scholar-text mb-1">{title}</h3>
              <p className="text-xs text-scholar-muted">{desc}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className={`mt-12 text-center text-xs text-scholar-muted transition-all duration-700 delay-600 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          <p>
            Built with Next.js • Powered by{' '}
            <a
              href="https://serpapi.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-scholar-accent hover:underline"
            >
              SerpAPI
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
