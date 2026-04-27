'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { Feedback } from '@/lib/feedbacks';
import type { FixVersion } from '@/lib/fix-prompt-md';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FixPromptPanel } from './FixPromptPanel';
import { LogsViewer } from './LogsViewer';

interface FeedbackDetailResponse {
  feedback: Feedback;
  logsText: string;
  fixPromptText: string;
  fixVersions: FixVersion[];
}

function firstSentence(s: string, max = 80): string {
  const m = s.match(/^.{1,200}?[.!?](\s|$)/);
  const t = (m ? m[0] : s).trim();
  if (t.length <= max) return t;
  return t.slice(0, max).trimEnd() + '…';
}

function longDate(iso: string): string {
  try {
    const d = new Date(iso);
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    return `${String(d.getDate()).padStart(2, '0')} ${month} · ${d.getFullYear()}`;
  } catch {
    return iso;
  }
}

export function FeedbackDetailSheet({
  open,
  onOpenChange,
  projectSlug,
  feedbackId,
  contextReady,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectSlug: string;
  feedbackId: string | null;
  contextReady: boolean;
}) {
  const [state, setState] = useState<{
    data: FeedbackDetailResponse | null;
    loading: boolean;
    error: string | null;
  }>({ data: null, loading: false, error: null });
  const { data, loading, error } = state;

  useEffect(() => {
    if (!open || !feedbackId) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ data: null, loading: true, error: null });
    fetch(
      `/api/feedback/${feedbackId}?projectSlug=${encodeURIComponent(projectSlug)}`,
      {
        cache: 'no-store',
      },
    )
      .then(async (r) => {
        const j = await r.json();
        if (cancelled) return;
        if (!r.ok) {
          setState({
            data: null,
            loading: false,
            error: (j as { error?: string }).error ?? 'failed to load',
          });
          return;
        }
        setState({
          data: j as FeedbackDetailResponse,
          loading: false,
          error: null,
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err.message : 'load failed',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, feedbackId, projectSlug]);

  const updateVersions = (versions: FixVersion[]) => {
    setState((prev) =>
      prev.data
        ? { ...prev, data: { ...prev.data, fixVersions: versions } }
        : prev,
    );
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side='right'
        className='!max-w-none w-full sm:w-[95vw] md:w-[90vw] lg:w-[85vw] xl:w-[1280px] sm:!max-w-[1280px] overflow-hidden bg-[var(--paper)] text-[var(--ink)] border-l border-[var(--rule-strong)] p-0'
      >
        <div className='flex flex-col h-full overflow-hidden'>
          <SheetHeader className='px-6 pt-6 pb-4 border-b border-[var(--rule)]'>
            <div className='eyebrow-mute mb-1'>
              Dispatch № {data?.feedback.id.slice(0, 6).toUpperCase() ?? '—'}
            </div>
            <SheetTitle
              className='serif-display !text-[30px]'
              style={{
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                fontWeight: 500,
              }}
            >
              {data ? firstSentence(data.feedback.description) : 'Loading…'}
            </SheetTitle>
            <SheetDescription className='ms-cap tnum text-[var(--mute)] mt-1'>
              {data ? longDate(data.feedback.createdAt) : ''}
            </SheetDescription>
          </SheetHeader>

          {loading && (
            <div className='flex items-center justify-center flex-1 text-[var(--mute)] ms-cap'>
              <Loader2 className='animate-spin size-4 mr-2' /> Setting Type…
            </div>
          )}

          {error && (
            <p
              className='marker text-xs px-6 py-3'
              role='alert'
            >
              {error}
            </p>
          )}

          {data && (
            <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden p-6'>
              {/* Left 5 — image, description, logs */}
              <div className='lg:col-span-5 flex flex-col gap-6 overflow-y-auto pr-2'>
                <div className='border border-[var(--rule)] overflow-hidden bg-[var(--secondary)]'>
                  <img
                    src={`/api/image/${data.feedback.imageKey}`}
                    alt='Dispatch screenshot'
                    className='w-full h-auto object-contain'
                  />
                </div>

                <div>
                  <div className='eyebrow mb-3'>The Description</div>
                  <div
                    className='dropcap-block serif-body whitespace-pre-wrap'
                    style={{ fontSize: '16px', lineHeight: 1.55 }}
                  >
                    {data.feedback.description}
                  </div>
                </div>

                <div>
                  <div className='eyebrow mb-3'>The Logs</div>
                  <LogsViewer text={data.logsText} />
                </div>
              </div>

              {/* Right 7 — verdict */}
              <div className='lg:col-span-7 flex flex-col gap-3 overflow-hidden min-h-0'>
                <div className='eyebrow'>The Verdict</div>
                {data.fixVersions.length === 0 ? (
                  <div className='border border-[var(--rule)] flex-1 flex items-center justify-center p-12'>
                    <div className='flex items-center gap-3'>
                      <span className='marker text-2xl serif-display'>§</span>
                      <p
                        className='serif-display italic'
                        style={{ fontSize: '20px' }}
                      >
                        “Awaiting verdict.”
                      </p>
                      <span className='marker text-2xl serif-display'>§</span>
                    </div>
                  </div>
                ) : null}
                <FixPromptPanel
                  projectSlug={projectSlug}
                  feedbackId={data.feedback.id}
                  versions={data.fixVersions}
                  contextReady={contextReady}
                  onVersionsChanged={updateVersions}
                />
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
