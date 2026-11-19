import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';

import { handleAvailabilityRequest } from '../../features/availability/availability.server.ts';

export const prerender = false;

export const GET: APIRoute = ({ request }) => handleAvailabilityRequest(request, env);
