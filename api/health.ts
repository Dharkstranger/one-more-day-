// Vercel serverless function: GET /api/health (is the sponsor configured?)
import { handleHealth } from '../server/sponsor';

export function GET(): Response {
  return handleHealth();
}
