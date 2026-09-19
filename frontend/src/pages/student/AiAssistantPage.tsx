import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Send, Sparkles } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useContentItems } from '../../hooks/useContentItems'
import { askAssistant, type AiAnswer } from '../../lib/ai'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge, Button, Card, Input } from '../../components/ui/Primitives'
import { ServiceUnavailable, Spinner } from '../../components/ui/Feedback'

const SUGGESTED_QUESTIONS = [
  'Are there any events this week?',
  'When is the exam period?',
  'How do I report a lost item?',
  'Can I book a classroom?',
  'What internships are available?',
  'Where can I find counselling support?',
]

interface ChatEntry {
  question: string
  answer: AiAnswer
}

export function AiAssistantPage() {
  const { profile } = useAuth()
  const { items, loading: loadingContent, cmsUnavailable } = useContentItems()
  const [question, setQuestion] = useState('')
  const [history, setHistory] = useState<ChatEntry[]>([])
  const [asking, setAsking] = useState(false)

  async function ask(q: string) {
    if (!q.trim() || asking) return
    setAsking(true)
    setQuestion('')
    try {
      const answer = await askAssistant(q, items, profile)
      setHistory((prev) => [...prev, { question: q, answer }])
    } finally {
      setAsking(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    ask(question)
  }

  if (loadingContent) return <Spinner label="Preparing the assistant…" />
  if (cmsUnavailable) return <ServiceUnavailable service="Campus content (needed to ground AI answers)" />

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="AI Assistant"
        description="Ask a question in plain language — answers are grounded in UCL ONE's own content."
      />

      {history.length === 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => ask(q)}
              className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 hover:border-ucl-blue hover:text-ucl-blue"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="mb-6 space-y-4">
        {history.map((entry, i) => (
          <div key={i} className="space-y-2">
            <div className="ml-auto max-w-[80%] rounded-lg bg-ucl-blue px-4 py-2 text-sm text-white">{entry.question}</div>
            <Card>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
                <Sparkles className="h-4 w-4" />
                {entry.answer.mode === 'gemini' ? 'UCL ONE Assistant' : 'UCL ONE Assistant (search fallback)'}
              </div>
              <p className="whitespace-pre-line text-sm text-slate-800">{entry.answer.text}</p>
              {entry.answer.routes.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {entry.answer.routes.map((r) => (
                    <Link key={r.path} to={r.path}>
                      <Badge color="blue">
                        <span className="flex items-center gap-1">
                          {r.label} <ArrowRight className="h-3 w-3" />
                        </span>
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </div>
        ))}
        {asking && <Spinner label="Thinking…" />}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input placeholder="Ask about events, deadlines, services…" value={question} onChange={(e) => setQuestion(e.target.value)} />
        <Button type="submit" disabled={asking || !question.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
