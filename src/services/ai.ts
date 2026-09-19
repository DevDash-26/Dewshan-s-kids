import { faqs, events, services } from '../data/demo';
import type { ChatMessage } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const provider = import.meta.env.VITE_AI_PROVIDER || 'gemini';

export const isAiConfigured = Boolean(apiKey && !apiKey.startsWith('placeholder'));

function mockAnswer(question: string): { content: string; sources: ChatMessage['sources'] } {
  const normalized = question.toLowerCase();
  if (normalized.includes('print')) return { content: 'The Print Hub is on the first floor of the Learning Commons. Demo hours are daily from 07:00 to 22:00, with print and scan services available.', sources: [{ label: 'Campus Services', path: '/campus-services' }] };
  if (normalized.includes('societ')) return { content: `There are ${4} active societies in the demo directory. Tech Society is meeting Wednesdays in Lab 2, and you can express interest directly from the Societies page.`, sources: [{ label: 'Societies', path: '/societies' }] };
  if (normalized.includes('event')) return { content: `${events.length} upcoming events are listed right now. The next one is “${events[0].title}” on 23 September at ${events[0].location}.`, sources: [{ label: 'Events', path: '/events' }] };
  if (normalized.includes('wellbeing') || normalized.includes('support')) return { content: 'The Wellbeing Desk is listed in Student Services, Room 104. This is demo information for the prototype, so please verify current support details with UCL before relying on them.', sources: [{ label: 'Wellbeing support', path: '/wellbeing' }] };
  if (normalized.includes('room') || normalized.includes('class')) return { content: 'You can find rooms by date, time and capacity on the Rooms page. Study Room A is currently shown as available for up to six people.', sources: [{ label: 'Rooms & bookings', path: '/rooms' }] };
  const faq = faqs.find((item) => normalized.includes(item.question.toLowerCase().split(' ').slice(2, 4).join(' ')));
  if (faq) return { content: faq.answer, sources: [{ label: 'Student FAQ', path: '/support' }] };
  return { content: 'I could not find verified UCL information for that yet. Try asking about events, societies, rooms, printing, wellbeing support or academic support, or contact the relevant UCL office for the latest guidance.', sources: [{ label: 'UCL Connect directory', path: '/campus-services' }] };
}

export async function askAssistant(question: string): Promise<Omit<ChatMessage, 'id' | 'role' | 'timestamp'>> {
  if (!isAiConfigured || provider !== 'gemini') return mockAnswer(question);
  try {
    const context = [...faqs.map((item) => `${item.question}: ${item.answer}`), ...services.map((item) => `${item.name}: ${item.description} (${item.location})`)].join('\n');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: `You are UCL Connect, a trusted campus information assistant. Only use the verified context below. If information is missing, say so clearly.\nContext:\n${context}\nQuestion: ${question}` }] }] }) });
    if (!response.ok) throw new Error('Gemini request failed');
    const data = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    return { content: data.candidates?.[0]?.content?.parts?.[0]?.text || mockAnswer(question).content, sources: [{ label: 'Verified UCL context', path: '/campus-services' }] };
  } catch (error) {
    console.warn('AI provider unavailable; using demo assistant.', error);
    return mockAnswer(question);
  }
}
