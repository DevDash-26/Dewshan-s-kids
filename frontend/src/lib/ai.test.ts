import { describe, expect, it } from 'vitest'
import { askAssistant } from './ai'
import type { ContentItem } from '../types/models'

// No VITE_GEMINI_API_KEY is set in the test environment, so askAssistant
// always exercises the deterministic fallback path here (BR33 robustness:
// the assistant must degrade gracefully, not crash or hallucinate, when the
// AI provider is unavailable).

function makeItem(overrides: Partial<ContentItem>): ContentItem {
  return {
    id: 1,
    title: 'Robotics Club',
    description: 'Weekly robotics workshops',
    category: 'SOCIETY',
    audience: 'EVERYONE',
    faculty: null,
    programme: null,
    yearGroup: null,
    eventDate: null,
    startTime: null,
    endTime: null,
    location: null,
    contact: null,
    status: 'PUBLISHED',
    isEmergency: false,
    createdByDisplay: null,
    publishedAt: null,
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('askAssistant fallback (no Gemini API key configured)', () => {
  it('rejects an empty query without crashing or calling the network', async () => {
    const result = await askAssistant('   ', [], null)
    expect(result.mode).toBe('fallback')
    expect(result.sources).toHaveLength(0)
  })

  it('finds a grounded match via keyword search and cites it as a source', async () => {
    const corpus = [makeItem({ id: 1, title: 'Robotics Club' }), makeItem({ id: 2, title: 'Photography Society', description: 'Campus photography' })]
    const result = await askAssistant('Tell me about the robotics club', corpus, null)
    expect(result.mode).toBe('fallback')
    expect(result.sources.map((s) => s.id)).toContain(1)
  })

  it('is honest when nothing in the corpus matches, rather than inventing an answer', async () => {
    const result = await askAssistant('xyzxyz nonsense query', [makeItem({})], null)
    expect(result.sources).toHaveLength(0)
    expect(result.text.toLowerCase()).toContain("couldn't find")
  })

  it('suggests the room booking route when the question is about booking a room', async () => {
    const result = await askAssistant('Can I book a classroom tomorrow?', [], null)
    expect(result.routes.some((r) => r.path === '/rooms')).toBe(true)
  })

  it('does not match "book" inside unrelated words like "textbook" (regression: word-boundary matching)', async () => {
    const corpus = [
      makeItem({ id: 1, category: 'EVENT', title: 'Inter-Faculty Football Tournament', description: 'Cheer on your faculty team.' }),
      makeItem({
        id: 2,
        category: 'TEXTBOOK',
        title: 'Second-Hand Textbooks — Data Structures',
        description: 'Selling a lightly used copy of the textbook.',
      }),
    ]
    const result = await askAssistant('Can I book a sports facility?', corpus, null)
    expect(result.sources.map((s) => s.id)).not.toContain(2)
  })

  it('ranks actual events above unrelated content that merely shares a word (regression: "week" vs "weekly")', async () => {
    const corpus = [
      makeItem({ id: 1, category: 'EVENT', title: 'AI Hackathon Showcase', description: 'Live demos this week.', eventDate: '2026-10-01' }),
      makeItem({ id: 2, category: 'DINING', title: 'Cafeteria Weekly Menu', description: 'This week\'s menu includes rice & curry.' }),
    ]
    const result = await askAssistant('Are there any events this week?', corpus, null)
    expect(result.sources[0]?.id).toBe(1)
  })
})
