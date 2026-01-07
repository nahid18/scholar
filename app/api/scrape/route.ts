import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Paper {
  title: string;
  authors: string;
  publication_info: string;
  link: string;
  pdf_link: string;
  cited_by: number;
  type: string;
  snippet: string;
}

interface SerpApiResult {
  title?: string;
  link?: string;
  snippet?: string;
  type?: string;
  publication_info?: {
    summary?: string;
    authors?: { name?: string }[];
  };
  inline_links?: {
    cited_by?: {
      total?: number;
    };
  };
  resources?: { link?: string }[];
}

interface SerpApiResponse {
  organic_results?: SerpApiResult[];
  error?: string;
}

export async function POST(req: NextRequest) {
  const { apiKey, keyword, maxResults = 1000 } = await req.json();

  if (!apiKey || !keyword) {
    return new Response(
      JSON.stringify({ error: 'API key and keyword are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const allPapers: Paper[] = [];
      let hasMoreResults = true;
      const limit = Math.min(maxResults, 1000);
      
      const sendEvent = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      sendEvent('status', { message: 'Starting search...', phase: 'init' });

      for (let start = 0; start < limit && hasMoreResults; start += 10) {
        const pageNum = Math.floor(start / 10) + 1;
        
        sendEvent('progress', {
          page: pageNum,
          totalPapers: allPapers.length,
          searching: true,
          message: `Fetching page ${pageNum}...`
        });

        try {
          const params = new URLSearchParams({
            engine: 'google_scholar',
            q: keyword,
            hl: 'en',
            start: start.toString(),
            api_key: apiKey,
          });

          const response = await fetch(
            `https://serpapi.com/search?${params.toString()}`
          );

          if (!response.ok) {
            if (response.status === 401) {
              sendEvent('error', { message: 'Invalid API key. Please check your SerpAPI key.' });
              controller.close();
              return;
            }
            throw new Error(`HTTP ${response.status}`);
          }

          const data: SerpApiResponse = await response.json();

          if (data.error) {
            sendEvent('error', { message: data.error });
            break;
          }

          const results = data.organic_results || [];

          if (results.length === 0) {
            hasMoreResults = false;
            sendEvent('status', { 
              message: `No more results found. Total: ${allPapers.length} papers`, 
              phase: 'complete' 
            });
            break;
          }

          for (const result of results) {
            const authors = result.publication_info?.authors || [];
            const resources = result.resources || [];
            
            const paper: Paper = {
              title: result.title || '',
              authors: authors.map((a) => a.name || '').join('; '),
              publication_info: result.publication_info?.summary || '',
              link: result.link || '',
              pdf_link: resources.length > 0 ? (resources[0].link || '') : '',
              cited_by: result.inline_links?.cited_by?.total || 0,
              type: result.type || '',
              snippet: result.snippet || '',
            };
            
            allPapers.push(paper);
          }

          sendEvent('papers', {
            newPapers: results.length,
            totalPapers: allPapers.length,
            latestPaper: allPapers[allPapers.length - 1]?.title || '',
          });

          // Small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 1000));

        } catch (error) {
          sendEvent('error', { 
            message: `Error on page ${pageNum}: ${error instanceof Error ? error.message : 'Unknown error'}` 
          });
          break;
        }
      }

      // Generate CSV
      if (allPapers.length > 0) {
        sendEvent('status', { message: 'Generating CSV...', phase: 'generating' });
        
        const headers = ['title', 'authors', 'publication_info', 'link', 'pdf_link', 'cited_by', 'type', 'snippet'];
        const escapeCsvValue = (value: string | number): string => {
          const str = String(value);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        };

        const csvRows = [
          headers.join(','),
          ...allPapers.map((paper) =>
            headers.map((header) => escapeCsvValue(paper[header as keyof Paper])).join(',')
          ),
        ];

        const csvContent = csvRows.join('\n');
        
        // Create safe filename
        const safeKeyword = keyword
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '')
          .substring(0, 50);
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `${safeKeyword}_${timestamp}.csv`;

        sendEvent('complete', {
          totalPapers: allPapers.length,
          filename,
          csv: csvContent,
        });
      } else {
        sendEvent('complete', {
          totalPapers: 0,
          filename: '',
          csv: '',
          message: 'No papers found for this search query.',
        });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
