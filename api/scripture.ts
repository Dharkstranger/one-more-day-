// Vercel serverless function: POST /api/scripture (the Scripture Guide agent)
import { handleScriptureRequest } from '../server/scriptureGuide';

export function POST(request: Request): Promise<Response> {
  return handleScriptureRequest(request);
}
