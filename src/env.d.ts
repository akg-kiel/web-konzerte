/// <reference types="astro/client" />

declare module 'cloudflare:workers' {
  export const env: {
    CHURCHTOOLS_BASE_URL?: string;
    CHURCHTOOLS_CALENDAR_IDS?: string;
    CHURCHTOOLS_EVENT_BUFFER_HOURS?: string;
    CHURCHTOOLS_TOKEN?: string;
  };
}
