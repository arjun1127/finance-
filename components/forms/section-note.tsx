interface SectionNoteProps {
  children: React.ReactNode
}

export function SectionNote({ children }: SectionNoteProps) {
  return (
    <p className="finance-muted-surface rounded-md px-3 py-2 text-meta">
      {children}
    </p>
  )
}
