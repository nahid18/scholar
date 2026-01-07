# Scholar Scraper 📚

A beautiful Next.js application to scrape research papers from Google Scholar using the SerpAPI.

![Scholar Scraper](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

## Features

- 🔍 Search Google Scholar for research papers
- 📊 Real-time progress visualization with beautiful animations
- 📥 Export results to CSV with all metadata
- 🎨 Dark mode with stunning neon accent design
- ⚡ Server-side streaming for live updates
- 🛡️ Safe handling when results are fewer than requested

## Getting Started

### Prerequisites

- Node.js 18+ 
- A SerpAPI key (get one at [serpapi.com/google-scholar-api](https://serpapi.com/google-scholar-api))

### Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Deploy to Vercel

The easiest way to deploy is using Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/scholar-scraper)

Or deploy manually:

1. Push this code to a GitHub repository
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Deploy!

## Usage

1. Enter your SerpAPI key
2. Enter a search keyword (e.g., `"perturb-seq"` or `machine learning`)
3. Click "Start Scraping"
4. Watch the beautiful progress animation
5. Download your CSV file when complete

## CSV Output

The exported CSV includes:

- `title` - Paper title
- `authors` - List of authors
- `publication_info` - Publication details
- `link` - URL to the paper
- `pdf_link` - Direct PDF link (if available)
- `cited_by` - Citation count
- `type` - Result type
- `snippet` - Paper snippet/abstract

## Limits

- Maximum 1,000 papers per search (100 pages × 10 results)
- Rate limited by SerpAPI (1 request per second)

## Tech Stack

- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **API**: SerpAPI Google Scholar

## License

MIT
