import { announcements, faqs, jobs, services } from '../data/demo';

const baseUrl = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';
const token = import.meta.env.VITE_STRAPI_API_TOKEN;

export async function fetchStrapi<T>(path: string, fallback: T): Promise<T> {
  if (!token || token.startsWith('placeholder')) return fallback;
  try {
    const response = await fetch(`${baseUrl}/api/${path}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error(`Strapi request failed: ${response.status}`);
    const payload = await response.json() as { data: T };
    return payload.data;
  } catch (error) {
    console.warn('Strapi unavailable; using demo content.', error);
    return fallback;
  }
}

export const getAnnouncements = () => fetchStrapi('announcements', announcements);
export const getFaqs = () => fetchStrapi('faqs', faqs);
export const getServices = () => fetchStrapi('services', services);
export const getJobs = () => fetchStrapi('jobs', jobs);
