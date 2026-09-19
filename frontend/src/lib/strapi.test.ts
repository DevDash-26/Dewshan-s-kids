import { describe, expect, it } from 'vitest'
import { fallbackContentForCategory } from './strapi'

describe('fallback content for the campus app', () => {
  it('returns default events when the CMS is unavailable', () => {
    const events = fallbackContentForCategory('EVENT')

    expect(events.length).toBeGreaterThan(0)
    expect(events[0].category).toBe('EVENT')
    expect(events[0].title.length).toBeGreaterThan(0)
  })
})