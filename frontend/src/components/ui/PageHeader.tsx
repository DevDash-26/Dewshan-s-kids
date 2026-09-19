import type { ReactNode } from 'react'

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ucl-blue/80">UCL ONE</p>
        <h1 className="ucl-section-title mt-2 text-3xl font-black tracking-[-0.06em] text-ucl-ink md:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">{description}</p>}
      </div>
      {actions}
    </div>
  )
}
