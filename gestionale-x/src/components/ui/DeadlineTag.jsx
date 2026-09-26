import { CalendarDays } from 'lucide-react'
import { relativeDay } from '../../lib/dates'

// Scadenza come etichetta: quella passata (e non completata) è in negativo, cioè nero pieno
const DeadlineTag = ({ iso, done }) => {
  const rel = iso ? relativeDay(iso) : null
  if (!rel) return null
  const late = rel.tone === 'late' && !done
  return (
    <span className={`tag ${late ? 'tag-invert' : ''}`} title={iso}>
      <CalendarDays size={11} aria-hidden="true" />
      {late ? `Scaduto ${rel.text}` : rel.text}
    </span>
  )
}

export default DeadlineTag
