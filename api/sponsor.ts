// Vercel serverless function: POST /api/sponsor
import { handleSponsorRequest } from '../server/sponsor';

export const maxDuration = 60;

export function POST(request: Request): Promise<Response> {
  return handleSponsorRequest(request);
}
