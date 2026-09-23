import { useCallback, useRef, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import type { AddictionRow } from '../db/types';
import { setAiSummary } from '../db/repo/logs';
import { buildSponsorContext } from '../services/ai/buildContext';
import { detectCrisis } from '../services/ai/crisis';
import { askSponsor, OFFLINE_REPLY } from '../services/ai/sponsorClient';
import type { SponsorMode, SponsorResponse, SponsorTurn } from '../services/ai/contract';
import { LIMITS } from '../services/ai/contract';

export interface SponsorMessage extends SponsorTurn {
  verse?: { reference: string; text: string };
  prayerChapter?: string | null;
}

/**
 * Conversation state lives in memory only and is gone when the screen closes.
 * The only thing saved is the AI's short summary, attached to the related log.
 */
export function useSponsor(opts: { mode: SponsorMode; addiction: AddictionRow | null; logId?: string; emotion?: string }) {
  const db = useSQLiteContext();
  const [messages, setMessages] = useState<SponsorMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [showCrisis, setShowCrisis] = useState(false);
  const [profileSuggestions, setProfileSuggestions] = useState<SponsorResponse['profile_suggestions']>([]);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim().slice(0, LIMITS.maxMessageChars);
      if (!trimmed) return;
      if (detectCrisis(trimmed)) setShowCrisis(true);

      const history: SponsorMessage[] = [...messages, { role: 'user', content: trimmed }];
      setMessages(history);
      setPending(true);

      const context = await buildSponsorContext(db, {
        mode: opts.mode,
        addiction: opts.addiction,
        text: trimmed,
        emotion: opts.emotion,
      });

      abortRef.current?.abort();
      abortRef.current = new AbortController();
      try {
        const res = await askSponsor(
          {
            mode: opts.mode,
            context,
            messages: history.slice(-LIMITS.maxMessages).map(({ role, content }) => ({ role, content })),
          },
          abortRef.current.signal,
        );
        const verse = context.candidateVerses.find((v) => v.id === res.verse_id);
        setMessages([...history, { role: 'assistant', content: res.reply, verse, prayerChapter: res.prayer_chapter }]);
        if (res.profile_suggestions.length) setProfileSuggestions(res.profile_suggestions);
        if (opts.logId && res.summary) await setAiSummary(db, opts.logId, res.summary);
      } catch {
        const verse = context.candidateVerses[0];
        setMessages([
          ...history,
          { role: 'assistant', content: OFFLINE_REPLY, verse, prayerChapter: context.prayerChapters[0] },
        ]);
      } finally {
        setPending(false);
      }
    },
    [db, messages, opts.mode, opts.addiction, opts.logId, opts.emotion],
  );

  return { messages, pending, showCrisis, profileSuggestions, send };
}
