'use client';

import type { Feedback } from '@/lib/feedbacks';

function excerpt(s: string, n = 200): string {
  if (s.length <= n) return s;
  return s.slice(0, n).trimEnd() + '…';
}

function shortDate(iso: string): string {
  try {
    const d = new Date(iso);
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    return `${String(d.getDate()).padStart(2, '0')} ${month} · ${d.getFullYear()}`;
  } catch {
    return iso;
  }
}

export function FeedbackCard({
  feedback,
  onClick,
  index,
}: {
  feedback: Feedback;
  onClick?: () => void;
  index?: number;
}) {
  const fixCount = feedback.fixVersions.length;
  const idShort = feedback.id.slice(0, 4).toUpperCase();
  const num =
    typeof index === 'number' ? String(index).padStart(2, '0') : idShort;

  return (
    <button
      type='button'
      onClick={onClick}
      className='group grid grid-cols-12 items-start gap-4 sm:gap-6 py-6 text-left border-b border-[var(--rule)] transition-colors hover:bg-[var(--hover-tint)] w-full'
    >
      {/* Left rail */}
      <div className='col-span-12 sm:col-span-2 flex flex-col gap-1 ms-cap text-[var(--mute)]'>
        <span className='text-[var(--ink)]'>№ {num}</span>
        <span className='tnum'>{shortDate(feedback.createdAt)}</span>
        <span
          className={
            fixCount > 0 ? 'text-[var(--accent-sage)]' : 'text-[var(--mute)]'
          }
        >
          {fixCount > 0 ? `Verdict v${fixCount}` : 'No verdict'}
        </span>
      </div>

      {/* Middle — description */}
      <div className='col-span-12 sm:col-span-7 flex flex-col gap-3 min-w-0'>
        <p
          className='serif-body'
          style={{ fontSize: '18px', lineHeight: 1.45, color: 'var(--ink)' }}
        >
          {excerpt(feedback.description)}
        </p>
        <span className='ms-cap text-[var(--ink)] transition-transform group-hover:translate-x-[2px]'>
          Read Dispatch →
        </span>
      </div>

      {/* Right — thumbnail */}
      <div className='col-span-12 sm:col-span-3'>
        <div className='border border-[var(--rule)] aspect-[4/3] overflow-hidden bg-[var(--secondary)]'>
          <img
            src={`/api/image/${feedback.imageKey}`}
            alt='Dispatch screenshot'
            className='size-full object-cover'
            loading='lazy'
          />
        </div>
      </div>
    </button>
  );
}
