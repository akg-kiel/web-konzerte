import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';

import { handleContactRequest } from '../../lib/contact-mail.ts';

export const prerender = false;

export const POST: APIRoute = ({ request }) => handleContactRequest(request, env);
export const ALL: APIRoute = POST;
