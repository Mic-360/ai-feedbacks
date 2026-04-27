'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ThreadStub {
  threadId: string;
  createdAt?: string;
}

export function ThreadList({
  threads,
  activeId,
  onSelect,
  onNewThread,
  loading,
}: {
  threads: ThreadStub[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewThread: () => void;
  loading?: boolean;
}) {
  return (
    <div className='flex flex-col border-r border-(--rule) w-56 overflow-y-auto shrink-0'>
      <div className='p-3 border-b border-(--rule)'>
        <Button
          variant='editorial-ghost'
          size='sm'
          onClick={onNewThread}
          disabled={loading}
          className='w-full h-9'
        >
          {loading ? <Loader2 className='animate-spin size-3' /> : null} New
          Correspondence →
        </Button>
      </div>
      <div className='flex flex-col'>
        {threads.length === 0 && (
          <p
            className='ms-cap text-(--mute) text-center mt-4 px-3 italic'
            style={{
              fontFamily: 'var(--font-body)',
              textTransform: 'none',
              letterSpacing: 0,
            }}
          >
            No correspondence yet.
          </p>
        )}
        {threads.map((t, i) => (
          <button
            key={t.threadId}
            type='button'
            onClick={() => onSelect(t.threadId)}
            className={cn(
              'text-left px-3 py-3 truncate transition-colors border-b border-(--rule) flex items-baseline gap-2',
              activeId === t.threadId
                ? 'bg-(--ink) text-(--paper)'
                : 'hover:bg-(--hover-tint) text-(--ink)',
            )}
          >
            <span className='ms-cap tnum opacity-70 shrink-0'>
              № {String(i + 1).padStart(2, '0')}
            </span>
            <span
              className='serif-body truncate'
              style={{ fontSize: '14px' }}
            >
              {t.threadId.slice(0, 12)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
