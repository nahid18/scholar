import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const filename = req.nextUrl.searchParams.get('file');
  
  if (!filename) {
    return new Response('Missing filename', { status: 400 });
  }

  const globalWithCsv = globalThis as typeof globalThis & { 
    generatedCSVs?: Map<string, string> 
  };
  
  const csv = globalWithCsv.generatedCSVs?.get(filename);
  
  if (!csv) {
    return new Response('File not found or expired', { status: 404 });
  }

  // Optionally delete after download (one-time use)
  // globalWithCsv.generatedCSVs.delete(filename);

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
