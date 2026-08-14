export const RELEASE1_PUBLIC_GUESS_STREAM_ENABLED = false;

export type Release1GuessVisibility = 'hidden-until-correct' | 'moderated-stream';

export function validateRelease1GuessVisibility(value: unknown): Release1GuessVisibility {
  const visibility = String(value ?? 'hidden-until-correct') as Release1GuessVisibility;
  if (visibility !== 'hidden-until-correct' && visibility !== 'moderated-stream') {
    throw new Error('Choose a supported guess visibility mode.');
  }
  if (visibility === 'moderated-stream' && !RELEASE1_PUBLIC_GUESS_STREAM_ENABLED) {
    throw new Error('Public guess streaming is disabled for the Release 1 launch.');
  }
  return visibility;
}
