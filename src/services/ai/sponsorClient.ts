import { RELAY_URL } from '../../config/env';
import type { SponsorRequest, SponsorResponse } from './contract';

export class SponsorUnavailableError extends Error {}

/** Sends one turn to the relay. No user id, device id, or auth header is sent. */
export async function askSponsor(request: SponsorRequest, signal?: AbortSignal): Promise<SponsorResponse> {
  if (!RELAY_URL) throw new SponsorUnavailableError('EXPO_PUBLIC_RELAY_URL is not set');

  let res: Response;
  try {
    res = await fetch(`${RELAY_URL.replace(/\/$/, '')}/sponsor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal,
    });
  } catch (e) {
    throw new SponsorUnavailableError(`Could not reach the sponsor: ${String(e)}`);
  }
  if (!res.ok) throw new SponsorUnavailableError(`Sponsor returned ${res.status}`);
  return (await res.json()) as SponsorResponse;
}

/** Shown when the AI can't be reached, so the person always gets something. */
export const OFFLINE_REPLIES: Record<SponsorRequest['mode'], string> = {
  urge:
    "I can't connect right now, but you are not alone in this. Take ten slow breaths, drink a glass of water, " +
    'and move to a different room or step outside. The urge will pass. Read the verse below and come back when you can.',
  slip:
    "I can't connect right now, but hear this: one slip doesn't cancel the fight you've been in. You were honest, " +
    "and that matters. Tonight, just do the next right thing: water, food, rest. Read the verse below. Tomorrow is one more day.",
  checkin:
    "I can't connect right now, but thank you for checking in. Showing up every day is how this is won. Read the verse below and keep going.",
  chat:
    "I can't connect right now. If you're struggling, press \"I'm struggling\" on the home screen for breathing and ideas, " +
    'or reach one of the helplines in Settings. Read the verse below. You are not alone.',
};
