'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

// Types
interface Paper {
  title: string
  link: string
  snippet: string
  type: string
  publication_info: string
  cited_by: number
  authors: string
  pdf_link: string
}

interface ScrapeProgress {
  current: number
  total: number
  papersFound: number
  status: 'idle' | 'scraping' | 'complete' | 'error'
  message: string
}

// Animated Icons
const SearchIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.3-4.3"/>
  </svg>
)

const DownloadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)

const KeyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
)

const BookIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
  </svg>
)

const SparkleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4"/>
    <path d="M19 17v4"/>
    <path d="M3 5h4"/>
    <path d="M17 19h4"/>
  </svg>
)

const FileTextIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <line x1="10" y1="9" x2="8" y2="9"/>
  </svg>
)

const ExternalLinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
)

// Animated loader component
const PaperLoader = () => {
  return (
    <div className="relative w-32 h-32">
      {/* Central book */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="animate-bounce-in">
          <BookIcon />
        </div>
      </div>
      
      {/* Orbiting papers */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute inset-0 animate-orbit"
          style={{
            animationDelay: `${i * 1.3}s`,
            animationDuration: '4s',
          }}
        >
          <div 
            className="w-6 h-8 bg-white rounded shadow-lg border border-gray-100 flex items-center justify-center"
            style={{ transform: 'translateX(50px)' }}
          >
            <div className="w-4 h-0.5 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
      
      {/* Pulsing ring */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-20 h-20 rounded-full border-2 border-accent/30 animate-pulse-ring" />
      </div>
    </div>
  )
}

// Progress visualization
const ProgressVisualization = ({ progress }: { progress: ScrapeProgress }) => {
  const percentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0
  
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Main progress ring */}
      <div className="flex items-center justify-center">
        <div className="relative">
          <svg className="w-48 h-48 transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="96"
              cy="96"
              r="80"
              fill="none"
              stroke="#e5e5e5"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="96"
              cy="96"
              r="80"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 80}`}
              strokeDashoffset={`${2 * Math.PI * 80 * (1 - percentage / 100)}`}
              className="transition-all duration-500 ease-out"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#e85d04" />
                <stop offset="100%" stopColor="#ff8a3d" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold font-display gradient-text">
              {Math.round(percentage)}%
            </span>
            <span className="text-sm text-muted mt-1">
              Page {progress.current} of {progress.total}
            </span>
          </div>
        </div>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-4 text-center card-hover">
          <div className="text-3xl font-bold gradient-text font-display">
            {progress.papersFound}
          </div>
          <div className="text-sm text-muted mt-1">Papers Found</div>
        </div>
        <div className="glass rounded-2xl p-4 text-center card-hover">
          <div className="text-3xl font-bold text-ink font-display">
            {progress.current * 10}
          </div>
          <div className="text-sm text-muted mt-1">Results Scanned</div>
        </div>
        <div className="glass rounded-2xl p-4 text-center card-hover">
          <div className="text-3xl font-bold text-ink font-display">
            {Math.max(0, (progress.total - progress.current) * 10)}
          </div>
          <div className="text-sm text-muted mt-1">Remaining</div>
        </div>
      </div>
      
      {/* Linear progress bar */}
      <div className="relative">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full progress-bar rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        {/* Animated dots */}
        <div className="flex justify-between mt-4">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i < Math.ceil(percentage / 10)
                  ? 'bg-accent scale-110'
                  : 'bg-gray-200'
              }`}
              style={{ transitionDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
      </div>
      
      {/* Status message */}
      <div className="text-center">
        <p className="text-muted font-mono text-sm">
          {progress.message}
        </p>
      </div>
    </div>
  )
}

// Paper card component for preview
const PaperCard = ({ paper, index }: { paper: Paper; index: number }) => (
  <div 
    className="glass rounded-xl p-4 card-hover animate-slide-up opacity-0"
    style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
  >
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center flex-shrink-0">
        <FileTextIcon />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-ink line-clamp-2 leading-snug">
          {paper.title}
        </h3>
        {paper.authors && (
          <p className="text-sm text-muted mt-1 truncate">
            {paper.authors}
          </p>
        )}
        <div className="flex items-center gap-3 mt-2">
          {paper.cited_by > 0 && (
            <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
              {paper.cited_by} citations
            </span>
          )}
          {paper.link && (
            <a 
              href={paper.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted hover:text-accent transition-colors flex items-center gap-1"
            >
              View <ExternalLinkIcon />
            </a>
          )}
        </div>
      </div>
    </div>
  </div>
)

// Main component
export default function Home() {
  const [apiKey, setApiKey] = useState('')
  const [keyword, setKeyword] = useState('')
  const [progress, setProgress] = useState<ScrapeProgress>({
    current: 0,
    total: 100,
    papersFound: 0,
    status: 'idle',
    message: '',
  })
  const [papers, setPapers] = useState<Paper[]>([])
  const [error, setError] = useState('')
  const [downloadUrl, setDownloadUrl] = useState('')
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // Sanitize filename
  const sanitizeFilename = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 50) || 'scholar_papers'
  }
  
  // Generate CSV content
  const generateCSV = (papers: Paper[]): string => {
    const fieldnames = ['title', 'authors', 'publication_info', 'link', 'pdf_link', 'cited_by', 'type', 'snippet']
    const escapeCSV = (value: string | number): string => {
      const str = String(value)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }
    
    const header = fieldnames.join(',')
    const rows = papers.map(paper => 
      fieldnames.map(field => escapeCSV(paper[field as keyof Paper] || '')).join(',')
    )
    
    return [header, ...rows].join('\n')
  }
  
  // Main scrape function
  const startScraping = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your SerpAPI key')
      return
    }
    if (!keyword.trim()) {
      setError('Please enter a search keyword')
      return
    }
    
    setError('')
    setPapers([])
    setDownloadUrl('')
    abortControllerRef.current = new AbortController()
    
    const allPapers: Paper[] = []
    const maxPages = 100 // 1000 results / 10 per page
    
    setProgress({
      current: 0,
      total: maxPages,
      papersFound: 0,
      status: 'scraping',
      message: 'Initializing search...',
    })
    
    try {
      for (let page = 0; page < maxPages; page++) {
        // Check if aborted
        if (abortControllerRef.current?.signal.aborted) {
          break
        }
        
        const start = page * 10
        
        setProgress(prev => ({
          ...prev,
          current: page + 1,
          message: `Fetching page ${page + 1}... Found ${allPapers.length} papers so far`,
        }))
        
        // Make API request
        const params = new URLSearchParams({
          engine: 'google_scholar',
          q: keyword,
          hl: 'en',
          start: String(start),
          api_key: apiKey,
        })
        
        const response = await fetch(`https://serpapi.com/search?${params}`, {
          signal: abortControllerRef.current?.signal,
        })
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Invalid API key. Please check your SerpAPI key.')
          }
          throw new Error(`API request failed: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        // Check for API errors
        if (data.error) {
          throw new Error(data.error)
        }
        
        const results = data.organic_results || []
        
        // No more results - stop gracefully
        if (results.length === 0) {
          setProgress(prev => ({
            ...prev,
            current: page + 1,
            total: page + 1,
            message: `Search complete! No more results found after page ${page + 1}`,
          }))
          break
        }
        
        // Process results
        for (const result of results) {
          const authors = result.publication_info?.authors || []
          const paper: Paper = {
            title: result.title || '',
            link: result.link || '',
            snippet: result.snippet || '',
            type: result.type || '',
            publication_info: result.publication_info?.summary || '',
            cited_by: result.inline_links?.cited_by?.total || 0,
            authors: authors.map((a: { name?: string }) => a.name || '').join('; '),
            pdf_link: result.resources?.[0]?.link || '',
          }
          allPapers.push(paper)
        }
        
        setPapers([...allPapers])
        setProgress(prev => ({
          ...prev,
          papersFound: allPapers.length,
        }))
        
        // Rate limiting - wait 1 second between requests
        if (page < maxPages - 1 && results.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
      
      // Generate and save CSV
      if (allPapers.length > 0) {
        const csvContent = generateCSV(allPapers)
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        setDownloadUrl(url)
        
        setProgress(prev => ({
          ...prev,
          status: 'complete',
          message: `Successfully harvested ${allPapers.length} papers!`,
        }))
      } else {
        setProgress(prev => ({
          ...prev,
          status: 'complete',
          message: 'No papers found for this search query.',
        }))
      }
      
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Handle abort - still save what we have
        if (allPapers.length > 0) {
          const csvContent = generateCSV(allPapers)
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
          const url = URL.createObjectURL(blob)
          setDownloadUrl(url)
        }
        setProgress(prev => ({
          ...prev,
          status: 'complete',
          message: `Stopped. Saved ${allPapers.length} papers.`,
        }))
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred')
        setProgress(prev => ({
          ...prev,
          status: 'error',
          message: 'An error occurred during scraping',
        }))
      }
    }
  }
  
  // Stop scraping
  const stopScraping = () => {
    abortControllerRef.current?.abort()
  }
  
  // Download CSV
  const downloadCSV = () => {
    if (!downloadUrl) return
    
    const filename = `${sanitizeFilename(keyword)}_papers.csv`
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  // Reset
  const reset = () => {
    setProgress({
      current: 0,
      total: 100,
      papersFound: 0,
      status: 'idle',
      message: '',
    })
    setPapers([])
    setDownloadUrl('')
    setError('')
  }

  return (
    <main className="min-h-screen paper-texture">
      {/* Decorative background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-accent/5 to-transparent rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-accent/5 to-transparent rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-gradient-to-r from-accent/3 to-transparent rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
      </div>
      
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="text-center mb-16 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <SparkleIcon />
            <span className="text-sm font-medium">Google Scholar Paper Scraper</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-4">
            Scholar<span className="gradient-text"> Harvest</span>
          </h1>
          
          <p className="text-lg text-muted max-w-xl mx-auto">
            Effortlessly collect research papers from Google Scholar. 
            Beautiful progress tracking, automatic CSV export.
          </p>
        </header>
        
        {/* Main content */}
        {progress.status === 'idle' ? (
          <div className="space-y-8 animate-fade-in">
            {/* API Key input */}
            <div className="glass rounded-3xl p-8 max-w-2xl mx-auto">
              <div className="space-y-6">
                {/* API Key field */}
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <KeyIcon />
                    SerpAPI Key
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your SerpAPI key"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-white/50 focus:border-accent transition-colors font-mono text-sm"
                  />
                  <a 
                    href="https://serpapi.com/google-scholar-api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-accent hover:text-accent-light mt-2 transition-colors"
                  >
                    Get your API key <ExternalLinkIcon />
                  </a>
                </div>
                
                {/* Keyword field */}
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <SearchIcon />
                    Search Keyword
                  </label>
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder='e.g., "perturb-seq" or machine learning'
                    className="w-full px-4 py-3 rounded-xl border border-border bg-white/50 focus:border-accent transition-colors"
                  />
                  <p className="text-sm text-muted mt-2">
                    Limited to 1000 results (100 pages)
                  </p>
                </div>
                
                {/* Error message */}
                {error && (
                  <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                    {error}
                  </div>
                )}
                
                {/* Start button */}
                <button
                  onClick={startScraping}
                  className="w-full btn-primary text-white font-medium py-4 px-6 rounded-xl flex items-center justify-center gap-2 relative z-10"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <SparkleIcon />
                    Start Harvesting
                  </span>
                </button>
              </div>
            </div>
            
            {/* Features */}
            <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {[
                { title: 'Beautiful Progress', desc: 'Real-time visual feedback' },
                { title: 'Auto CSV Export', desc: 'Download when complete' },
                { title: 'Safe & Reliable', desc: 'Graceful error handling' },
              ].map((feature, i) => (
                <div 
                  key={i}
                  className="glass rounded-2xl p-5 text-center card-hover animate-slide-up opacity-0"
                  style={{ animationDelay: `${0.2 + i * 0.1}s`, animationFillMode: 'forwards' }}
                >
                  <h3 className="font-medium mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Progress visualization */}
            <div className="glass rounded-3xl p-8 animate-bounce-in">
              {progress.status === 'scraping' ? (
                <ProgressVisualization progress={progress} />
              ) : (
                <div className="text-center space-y-6">
                  {/* Success state */}
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 text-white animate-bounce-in">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  
                  <div>
                    <h2 className="text-3xl font-display font-bold mb-2">
                      {progress.papersFound} Papers Harvested!
                    </h2>
                    <p className="text-muted">{progress.message}</p>
                  </div>
                  
                  {/* Download button */}
                  {downloadUrl && (
                    <button
                      onClick={downloadCSV}
                      className="btn-primary text-white font-medium py-4 px-8 rounded-xl inline-flex items-center gap-2 relative z-10"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <DownloadIcon />
                        Download CSV
                      </span>
                    </button>
                  )}
                  
                  {/* Reset button */}
                  <div>
                    <button
                      onClick={reset}
                      className="text-muted hover:text-ink transition-colors text-sm"
                    >
                      ← Start new search
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Stop button */}
            {progress.status === 'scraping' && (
              <div className="text-center">
                <button
                  onClick={stopScraping}
                  className="px-6 py-3 rounded-xl border border-border hover:border-red-300 hover:bg-red-50 text-red-500 transition-colors text-sm font-medium"
                >
                  Stop & Save Progress
                </button>
              </div>
            )}
            
            {/* Paper preview */}
            {papers.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-display font-bold text-xl flex items-center gap-2">
                  <BookIcon />
                  Recent Papers
                </h3>
                <div className="grid gap-3 max-h-96 overflow-y-auto pr-2">
                  {papers.slice(-10).reverse().map((paper, i) => (
                    <PaperCard key={`${paper.title}-${i}`} paper={paper} index={i} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-muted">
          <p>
            Powered by{' '}
            <a 
              href="https://serpapi.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-accent hover:text-accent-light transition-colors"
            >
              SerpAPI
            </a>
            {' '}· Built with Next.js
          </p>
        </footer>
      </div>
    </main>
  )
}
