export function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 7h14" />
      <path d="M9.5 7V5.8c0-.7.5-1.3 1.2-1.3h2.6c.7 0 1.2.6 1.2 1.3V7" />
      <path d="M7.2 7l.8 12.2c.1.8.7 1.4 1.5 1.4h5c.8 0 1.4-.6 1.5-1.4L16.8 7" />
      <path d="M10 11v5.5M14 11v5.5" />
    </svg>
  )
}

export default function TrashBtn({ onClick, label = 'Löschen' }) {
  return (
    <button
      type="button"
      className="icon-trash"
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(e)
      }}
      aria-label={label}
      title={label}
    >
      <TrashIcon />
    </button>
  )
}
