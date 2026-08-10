'use client';

export function BingoBoard({ numbers, size, drawn = [], compact = false }: { numbers: readonly number[]; size: number; drawn?: readonly number[]; compact?: boolean }) {
  const marked = new Set(drawn);
  return (
    <div className={`bingo-board ${compact ? 'compact' : ''}`} style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }} role="grid" aria-label={`${size} by ${size} Bingo board`}>
      {numbers.map((value, index) => {
        const isMarked = marked.has(value);
        return <div className={`bingo-cell ${isMarked ? 'marked' : ''}`} role="gridcell" aria-label={`${value}${isMarked ? ', marked' : ''}`} key={`${value}-${index}`}><span>{value}</span>{isMarked && <small>✓</small>}</div>;
      })}
    </div>
  );
}
