import type { ButtonHTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>{children}</div>
}

const VARIANT_CLASSES = {
  primary: 'bg-ucl-blue text-white hover:bg-blue-800 disabled:bg-slate-300',
  secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 disabled:text-slate-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-slate-300',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
} as const

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof VARIANT_CLASSES }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  )
}

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className="mb-1 block text-sm font-medium text-slate-700" {...props} />
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-ucl-blue focus:outline-none focus:ring-1 focus:ring-ucl-blue"
      {...props}
    />
  )
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-ucl-blue focus:outline-none focus:ring-1 focus:ring-ucl-blue"
      {...props}
    />
  )
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-ucl-blue focus:outline-none focus:ring-1 focus:ring-ucl-blue"
      {...props}
    />
  )
}

const BADGE_CLASSES = {
  neutral: 'bg-slate-100 text-slate-700',
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
} as const

export function Badge({ children, color = 'neutral' }: { children: ReactNode; color?: keyof typeof BADGE_CLASSES }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE_CLASSES[color]}`}>{children}</span>
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{message}</p>
}
