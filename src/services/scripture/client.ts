import { RELAY_URL } from '../../config/env';
import type { ScriptureGuidance, ScriptureRequest } from './contract';

/** Asks the Scripture Guide agent. Takes a few seconds: it searches and reads before choosing. */
export async function askScriptureGuide(request: ScriptureRequest, signal?: AbortSignal): Promise<ScriptureGuidance> {
  if (!RELAY_URL) throw new Error('no relay configured');
  const res = await fetch(`${RELAY_URL.replace(/\/$/, '')}/scripture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal,
  });
  if (!res.ok) throw new Error(`guide returned ${res.status}`);
  return (await res.json()) as ScriptureGuidance;
}
