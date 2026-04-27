'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { FixVersion } from '@/lib/fix-prompt-md';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export function FixPromptPanel({
  projectSlug,
  feedbackId,
  versions,
  contextReady,
  onVersionsChanged,
}: {
  projectSlug: string;
  feedbackId: string;
  versions: FixVersion[];
  contextReady: boolean;
  onVersionsChanged?: (versions: FixVersion[]) => void;
}) {
  const [streaming, setStreaming] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedV, setSelectedV] = useState<number | null>(null);

  useEffect(() => {
    if (selectedV === null && versions.length > 0) {
      setSelectedV(versions[0]!.v);
    }
  }, [versions, selectedV]);

  const current = useMemo(() => {
    if (isStreaming) return streaming;
    if (selectedV !== null) {
      const v = versions.find((x) => x.v === selectedV);
      if (v) return v.body;
    }
    return versions[0]?.body ?? '';
  }, [streaming, isStreaming, selectedV, versions]);

  async function generate() {
    if (!contextReady) return;
    setError(null);
    setStreaming('');
    setIsStreaming(true);
    try {
      const res = await fetch(
        `/api/feedback/${feedbackId}/generate-fix?projectSlug=${encodeURIComponent(projectSlug)}`,
        { method: 'POST' },
      );
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? 'failed to generate');
        setIsStreaming(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setStreaming(acc);
      }
      // refetch fixVersions
      const fresh = await fetch(
        `/api/feedback/${feedbackId}?projectSlug=${encodeURIComponent(projectSlug)}`,
        { cache: 'no-store' },
      );
      if (fresh.ok) {
        const data = (await fresh.json()) as { fixVersions?: FixVersion[] };
        if (data.fixVersions) {
          onVersionsChanged?.(data.fixVersions);
          setSelectedV(data.fixVersions[0]?.v ?? null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'stream failed');
    } finally {
      setIsStreaming(false);
    }
  }

  function copy() {
    if (!current) return;
    navigator.clipboard.writeText(current);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className='flex flex-col gap-3 h-full'>
      <div className='flex items-center gap-2 flex-wrap'>
        <Button
          variant='default'
          onClick={generate}
          disabled={!contextReady || isStreaming}
          className='h-9 px-4'
        >
          {isStreaming ? <Loader2 className='animate-spin size-3' /> : null}
          {isStreaming
            ? 'Drafting Task…'
            : versions.length
              ? 'Redraft Task →'
              : 'Generate Fix →'}
        </Button>
        <Button
          variant='ghost'
          onClick={copy}
          disabled={!current}
          className='h-9 px-4'
        >
          {copied ? <Check className='size-3' /> : null}
          {copied ? 'Copied' : 'Copy →'}
        </Button>
        {versions.length > 0 && !isStreaming && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant='ghost'
                  className='ml-auto h-9 px-3'
                >
                  v{selectedV ?? versions[0]!.v}{' '}
                  <ChevronDown className='size-3' />
                </Button>
              }
            />
            <DropdownMenuContent align='end'>
              {versions.map((v) => (
                <DropdownMenuItem
                  key={v.v}
                  onClick={() => setSelectedV(v.v)}
                >
                  Version {v.v} — {new Date(v.generatedAt).toLocaleString()}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {!contextReady && (
        <p className='ms-cap text-(--mute) border border-(--rule) p-3'>
          Project context is still being generated. Drafting will resume once it is
          ready.
        </p>
      )}

      {error && (
        <p
          className='text-xs marker italic serif-body'
          role='alert'
        >
          {error}
        </p>
      )}

      <div
        className='flex-1 border border-(--rule) overflow-auto'
        style={{ background: 'var(--paper-soft)' }}
      >
        <pre
          className='p-4 whitespace-pre-wrap wrap-break-word'
          style={{
            fontFamily: 'var(--font-mono), ui-monospace, monospace',
            fontSize: '13px',
            lineHeight: 1.6,
            color: 'var(--ink)',
          }}
        >
          {current ||
            (isStreaming
              ? '…'
              : 'No task on file. Press Generate Fix to draft one.')}
        </pre>
      </div>
    </div>
  );
}
