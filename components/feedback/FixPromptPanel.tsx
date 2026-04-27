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
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

function omitMarkdownNode<T extends { node?: unknown }>(
  props: T,
): Omit<T, 'node'> {
  const { node, ...rest } = props;
  void node;
  return rest;
}

const markdownComponents: Components = {
  a(props) {
    const rest = omitMarkdownNode(props);

    return (
      <a
        {...rest}
        className='marker underline decoration-(--rule-strong) underline-offset-4 hover:decoration-(--marker)'
        rel='noreferrer noopener'
        target='_blank'
      />
    );
  },
  blockquote(props) {
    const rest = omitMarkdownNode(props);

    return (
      <blockquote
        {...rest}
        className='border-l-2 border-(--marker) pl-4 italic text-(--ink-soft)'
      />
    );
  },
  code(props) {
    const { className, children, ...rest } = omitMarkdownNode(props);
    const hasLanguage = /language-\w+/.test(className ?? '');

    return (
      <code
        {...rest}
        className={[
          'font-mono text-[0.92em]',
          hasLanguage
            ? 'block min-w-max whitespace-pre p-0'
            : 'border border-(--rule) bg-(--paper) px-1 py-0.5',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </code>
    );
  },
  h1(props) {
    const rest = omitMarkdownNode(props);

    return (
      <h1
        {...rest}
        className='serif-display text-2xl leading-tight text-(--ink)'
      />
    );
  },
  h2(props) {
    const rest = omitMarkdownNode(props);

    return (
      <h2
        {...rest}
        className='serif-display text-xl leading-tight text-(--ink)'
      />
    );
  },
  h3(props) {
    const rest = omitMarkdownNode(props);

    return (
      <h3
        {...rest}
        className='serif-display text-lg leading-tight text-(--ink)'
      />
    );
  },
  hr(props) {
    const rest = omitMarkdownNode(props);

    return (
      <hr
        {...rest}
        className='border-(--rule)'
      />
    );
  },
  li(props) {
    const rest = omitMarkdownNode(props);

    return (
      <li
        {...rest}
        className='pl-1 marker:text-(--marker)'
      />
    );
  },
  ol(props) {
    const rest = omitMarkdownNode(props);

    return (
      <ol
        {...rest}
        className='list-decimal space-y-1 pl-6'
      />
    );
  },
  p(props) {
    const rest = omitMarkdownNode(props);

    return (
      <p
        {...rest}
        className='leading-7 text-(--ink)'
      />
    );
  },
  pre(props) {
    const rest = omitMarkdownNode(props);

    return (
      <pre
        {...rest}
        className='overflow-x-auto border border-(--rule) bg-(--paper) p-3 leading-6 text-(--ink)'
      />
    );
  },
  table(props) {
    const rest = omitMarkdownNode(props);

    return (
      <div className='overflow-x-auto border border-(--rule)'>
        <table
          {...rest}
          className='w-full min-w-max border-collapse text-sm'
        />
      </div>
    );
  },
  tbody(props) {
    const rest = omitMarkdownNode(props);

    return <tbody {...rest} />;
  },
  td(props) {
    const rest = omitMarkdownNode(props);

    return (
      <td
        {...rest}
        className='border-t border-(--rule) px-3 py-2 align-top'
      />
    );
  },
  th(props) {
    const rest = omitMarkdownNode(props);

    return (
      <th
        {...rest}
        className='border-b border-(--rule-strong) px-3 py-2 text-left font-medium'
      />
    );
  },
  thead(props) {
    const rest = omitMarkdownNode(props);

    return (
      <thead
        {...rest}
        className='bg-(--hover-tint)'
      />
    );
  },
  ul(props) {
    const rest = omitMarkdownNode(props);

    return (
      <ul
        {...rest}
        className='list-disc space-y-1 pl-6'
      />
    );
  },
};

export function FixPromptPanel({
  projectSlug,
  feedbackId,
  versions,
  contextReady,
  onVersionsChangedAction,
}: {
  projectSlug: string;
  feedbackId: string;
  versions: FixVersion[];
  contextReady: boolean;
  onVersionsChangedAction?: (versions: FixVersion[]) => void;
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
          onVersionsChangedAction?.(data.fixVersions);
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
          Project context is still being generated. Drafting will resume once it
          is ready.
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
        {current ? (
          <div className='flex flex-col gap-4 p-4 text-sm text-(--ink) wrap-break-word'>
            <ReactMarkdown
              components={markdownComponents}
              remarkPlugins={[remarkGfm]}
              skipHtml
            >
              {current}
            </ReactMarkdown>
          </div>
        ) : (
          <p
            className='p-4 text-sm text-(--mute)'
            style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
          >
            {isStreaming
              ? '…'
              : 'No task on file. Press Generate Fix to draft one.'}
          </p>
        )}
      </div>
    </div>
  );
}
