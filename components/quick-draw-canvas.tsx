'use client';

import { useMemo, useRef, useState, type PointerEvent } from 'react';

export type QuickDrawStrokeEvent = {
  sequence: number;
  payload:
    | { type: 'clear' }
    | { type: 'stroke'; points: Array<{ x: number; y: number }>; width: number };
};

type Props = {
  strokes: QuickDrawStrokeEvent[];
  editable?: boolean;
  disabled?: boolean;
  onStroke?: (payload: { type: 'stroke'; points: Array<{ x: number; y: number }>; width: number }) => Promise<unknown> | unknown;
  onClear?: () => Promise<unknown> | unknown;
};

function visibleStrokeEvents(events: QuickDrawStrokeEvent[]) {
  let visible: QuickDrawStrokeEvent[] = [];
  for (const event of events) {
    if (event.payload.type === 'clear') visible = [];
    else visible.push(event);
  }
  return visible;
}

function pointsString(points: Array<{ x: number; y: number }>) {
  return points.map((point) => `${point.x * 1000},${point.y * 700}`).join(' ');
}

export function QuickDrawCanvas({ strokes, editable = false, disabled = false, onStroke, onClear }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const drawingRef = useRef(false);
  const bufferRef = useRef<Array<{ x: number; y: number }>>([]);
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());
  const [draft, setDraft] = useState<Array<{ x: number; y: number }>>([]);
  const visible = useMemo(() => visibleStrokeEvents(strokes), [strokes]);

  function normalizedPoint(event: PointerEvent<SVGSVGElement>) {
    const bounds = svgRef.current?.getBoundingClientRect();
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return null;
    return {
      x: Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)),
      y: Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height)),
    };
  }

  function enqueueChunk(points: Array<{ x: number; y: number }>) {
    if (!onStroke || points.length < 2) return;
    const payload = { type: 'stroke' as const, points: points.slice(0, 32), width: 4 };
    queueRef.current = queueRef.current.then(() => onStroke(payload)).catch(() => undefined);
  }

  function flushBuffer(keepTail = false) {
    const points = bufferRef.current;
    if (points.length >= 2) enqueueChunk(points);
    bufferRef.current = keepTail && points.length ? [points[points.length - 1]] : [];
  }

  function pointerDown(event: PointerEvent<SVGSVGElement>) {
    if (!editable || disabled) return;
    const point = normalizedPoint(event);
    if (!point) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    bufferRef.current = [point];
    setDraft([point]);
  }

  function pointerMove(event: PointerEvent<SVGSVGElement>) {
    if (!drawingRef.current || !editable || disabled) return;
    const point = normalizedPoint(event);
    if (!point) return;
    bufferRef.current.push(point);
    setDraft((current) => [...current, point]);
    // Chunking at ~12 points keeps drawing responsive while staying well below the server flood limit.
    if (bufferRef.current.length >= 12) flushBuffer(true);
  }

  function pointerUp(event: PointerEvent<SVGSVGElement>) {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    flushBuffer(false);
    setDraft([]);
  }

  async function clearCanvas() {
    if (!editable || disabled || !onClear) return;
    // Finish the current local stroke first, then serialize Clear behind all queued chunks.
    // This prevents a slow in-flight stroke from arriving after Clear and reappearing on other devices.
    if (drawingRef.current) {
      drawingRef.current = false;
      flushBuffer(false);
    }
    setDraft([]);
    bufferRef.current = [];
    queueRef.current = queueRef.current.then(() => onClear()).catch(() => undefined);
    await queueRef.current;
  }

  return <div className="quick-draw-canvas-wrap">
    <svg
      ref={svgRef}
      className={`quick-draw-canvas ${editable ? 'editable' : ''}`}
      viewBox="0 0 1000 700"
      role="img"
      aria-label={editable ? 'Quick Draw drawing canvas' : 'Live Quick Draw canvas'}
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onPointerCancel={pointerUp}
      onPointerLeave={(event) => { if (drawingRef.current && event.buttons === 0) pointerUp(event); }}
    >
      <rect x="0" y="0" width="1000" height="700" rx="28" className="quick-draw-paper" />
      {visible.map((event) => event.payload.type === 'stroke' && <polyline
        key={event.sequence}
        points={pointsString(event.payload.points)}
        fill="none"
        className="quick-draw-line"
        strokeWidth={event.payload.width * 2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />)}
      {draft.length > 1 && <polyline points={pointsString(draft)} fill="none" className="quick-draw-line draft" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
    {editable && <div className="quick-draw-tools">
      <span className="support">Draw with mouse, finger, or stylus.</span>
      <button className="btn secondary" type="button" disabled={disabled} onClick={() => void clearCanvas()}>Clear canvas</button>
    </div>}
  </div>;
}
