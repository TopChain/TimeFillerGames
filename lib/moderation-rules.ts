export const CONTENT_REPORT_KINDS = ['drawing', 'nickname', 'behavior'] as const;
export const CONTENT_REPORT_REASONS = ['inappropriate', 'harassment', 'spam', 'other'] as const;

export type ContentReportKind = (typeof CONTENT_REPORT_KINDS)[number];
export type ContentReportReason = (typeof CONTENT_REPORT_REASONS)[number];

export function parseContentReport(value: unknown): {
  targetParticipantId: string;
  kind: ContentReportKind;
  reason: ContentReportReason;
} {
  if (!value || typeof value !== 'object') throw new Error('Invalid report request.');
  const input = value as Record<string, unknown>;
  const targetParticipantId = String(input.targetParticipantId ?? '').trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(targetParticipantId)) {
    throw new Error('Choose a valid room participant to report.');
  }
  const kind = String(input.kind ?? '') as ContentReportKind;
  if (!(CONTENT_REPORT_KINDS as readonly string[]).includes(kind)) throw new Error('Choose a valid report category.');
  const reason = String(input.reason ?? '') as ContentReportReason;
  if (!(CONTENT_REPORT_REASONS as readonly string[]).includes(reason)) throw new Error('Choose a valid report reason.');
  return { targetParticipantId, kind, reason };
}
