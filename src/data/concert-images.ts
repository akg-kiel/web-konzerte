import { inferRemoteSize } from 'astro/assets/utils/inferRemoteSize.js';

import { getConcertImagePosition, getImageAspectRatio, type Concert } from './concerts.ts';

export async function resolveConcertImage(concert: Concert): Promise<Concert> {
  if (
    !concert.image ||
    (Number.isFinite(concert.imageAspectRatio) && (concert.imageAspectRatio ?? 0) > 0)
  )
    return concert;

  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const url = new URL(concert.image);
    if (url.origin !== 'https://akg-kiel.church.tools') return concert;
    // ponytail: Astro's probe has no AbortSignal; bound SSR wait until it supports cancellation.
    const { width, height } = await Promise.race([
      inferRemoteSize(concert.image, {
        domains: [],
        remotePatterns: [{ protocol: 'https', hostname: 'akg-kiel.church.tools' }]
      }),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error('Image dimension inference timed out')), 3000);
      })
    ]);
    const imageAspectRatio = getImageAspectRatio(width, height);
    if (imageAspectRatio) {
      return {
        ...concert,
        imageAspectRatio,
        imagePosition: getConcertImagePosition(concert.imageFocus, imageAspectRatio)
      };
    }
  } catch {
    // An unavailable poster must not prevent the rest of the page from rendering.
  } finally {
    clearTimeout(timeout);
  }
  return { ...concert, image: undefined, imagePosition: '50% 50%' };
}
