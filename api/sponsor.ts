// Vercel serverless function: POST /api/sponsor
import { handleSponsorRequest } from '../server/sponsor';

export function POST(request: Request): Promise<Response> {
  return handleSponsorRequest(request);
}
