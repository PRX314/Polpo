import { useEffect, useRef, useState } from 'react'

// Menu a comparsa: un pulsante e una lista di voci. Si chiude con Esc o cliccando fuori.
// items: [{ label, icon, onClick, href, danger, disabled } | 'sep' | { header }]
const Menu = ({ trigger, items, align = 'right', label = 'Menu' }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="menu" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button
        type="button" className="btn-icon" aria-haspopup="menu" aria-expanded={open} aria-label={label}
        onClick={() => setOpen(o => !o)}
      >
        {trigger}
      </button>
      {open && (
        <div className={`menu-pop ${align === 'left' ? 'left' : ''}`} role="menu">
          {items.filter(Boolean).map((it, i) => {
            if (it === 'sep') return <div key={i} className="menu-sep" />
            if (it.header) return <div key={i} className="menu-label">{it.header}</div>
            const Icon = it.icon
            const content = <>{Icon && <Icon size={16} aria-hidden="true" />}<span>{it.label}</span></>
            return it.href ? (
              <a key={i} role="menuitem" className="menu-item" href={it.href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>{content}</a>
            ) : (
              <button
                key={i} type="button" role="menuitem" className="menu-item" disabled={it.disabled}
                onClick={() => { setOpen(false); it.onClick?.() }}
              >
                {content}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Menu
