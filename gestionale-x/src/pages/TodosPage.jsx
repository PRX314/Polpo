import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronRight, BookOpen } from 'lucide-react'
import EmptyState from '../components/ui/EmptyState'
import { useData } from '../context/useData'
import { addDaysIso, oggiIso, relativeDay } from '../lib/dates'
import './TodosPage.css'

// Tutte le cose da fare, di tutti i progetti, in un posto solo.
//
// Serve da quando il gestionale conosce tutti i progetti: le voci aperte sono
// passate da poche decine a oltre duecento, sparse in decine di schede.
// Sapere "cosa ho in sospeso" voleva dire aprirle una per una.

const FILTRI = [
  { id: 'tutte', label: 'Tutte' },
  { id: 'scadute', label: 'Scadute' },
  { id: 'settimana', label: 'Questa settimana' },
  { id: 'conScadenza', label: 'Con scadenza' },
  { id: 'senzaScadenza', label: 'Senza scadenza' },
]

const TodosPage = () => {
  const { projects, loading, actions } = useData()
  const [filtro, setFiltro] = useState('tutte')
  // Le tue (aggiunte nell'app) o la roadmap arrivata dal vault: prima erano mescolate,
  // e 300 voci di roadmap senza data nascondevano le poche cose da fare vere
  const [origine, setOrigine] = useState('mie')
  const [cerca, setCerca] = useState('')
  const [mostraFatte, setMostraFatte] = useState(false)
  const [chiusi, setChiusi] = useState(() => new Set())
  const [inCorso, setInCorso] = useState(null)

  const oggi = oggiIso()
  const fraUnaSettimana = addDaysIso(7)

  // Una riga per ogni voce, con addosso il progetto da cui viene
  const righe = useMemo(() => {
    const out = []
    projects.filter(p => !p.archived).forEach(p => {
      ;(p.todos || []).forEach((t, i) => {
        out.push({
          chiave: `${p.id}-${i}`, indice: i, progetto: p,
          testo: t.text || '', fatta: !!t.completed,
          scadenza: t.deadline || '', ora: t.time || '', daVault: !!t.daVault
        })
      })
    })
    return out
  }, [projects])

  const visibili = useMemo(() => {
    const q = cerca.trim().toLowerCase()
    let r = righe.filter(x => (mostraFatte || !x.fatta) && (origine === 'roadmap' ? x.daVault : !x.daVault))
    if (filtro === 'scadute') r = r.filter(x => x.scadenza && x.scadenza < oggi)
    else if (filtro === 'settimana') r = r.filter(x => x.scadenza && x.scadenza >= oggi && x.scadenza <= fraUnaSettimana)
    else if (filtro === 'conScadenza') r = r.filter(x => x.scadenza)
    else if (filtro === 'senzaScadenza') r = r.filter(x => !x.scadenza)
    if (q) r = r.filter(x => x.testo.toLowerCase().includes(q) || (x.progetto.name || '').toLowerCase().includes(q))
    return r
  }, [righe, filtro, cerca, mostraFatte, oggi, fraUnaSettimana, origine])

  // Raggruppate per progetto: con oltre duecento voci un elenco piatto è illeggibile
  const gruppi = useMemo(() => {
    const m = new Map()
    for (const r of visibili) {
      if (!m.has(r.progetto.id)) m.set(r.progetto.id, { progetto: r.progetto, righe: [] })
      m.get(r.progetto.id).righe.push(r)
    }
    return [...m.values()].sort((a, b) => {
      // prima chi ha qualcosa di scaduto, poi chi ne ha di più
      const sA = a.righe.some(x => x.scadenza && x.scadenza < oggi) ? 1 : 0
      const sB = b.righe.some(x => x.scadenza && x.scadenza < oggi) ? 1 : 0
      if (sA !== sB) return sB - sA
      if (a.righe.length !== b.righe.length) return b.righe.length - a.righe.length
      return (a.progetto.name || '').localeCompare(b.progetto.name || '')
    })
  }, [visibili, oggi])

  const mieAperte = righe.filter(x => !x.fatta && !x.daVault).length
  const roadmapAperte = righe.filter(x => !x.fatta && x.daVault).length
  const aperte = origine === 'roadmap' ? roadmapAperte : mieAperte
  const scadute = righe.filter(x => !x.fatta && x.scadenza && x.scadenza < oggi).length
  const progettiConLavoro = new Set(righe.filter(x => !x.fatta && (origine === 'roadmap') === x.daVault).map(x => x.progetto.id)).size

  const spunta = async (riga) => {
    if (inCorso) return
    setInCorso(riga.chiave)
    try {
      const todos = (riga.progetto.todos || []).map((t, i) => i === riga.indice ? { ...t, completed: !t.completed } : t)
      await actions.update(riga.progetto.id, { todos })
    } finally {
      setInCorso(null)
    }
  }

  const apriChiudi = (id) => setChiusi(prev => {
    const n = new Set(prev)
    if (n.has(id)) n.delete(id); else n.add(id)
    return n
  })

  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="page-head">
        <div>
          <h1>Cose da fare</h1>
          <p className="sub">
            {loading ? 'Carico…' : `${aperte} aperte in ${progettiConLavoro} progetti`}
            {scadute > 0 && <> · <strong>{scadute} scadute</strong></>}
          </p>
        </div>
      </div>

      <div className="chips" role="tablist" aria-label="Quali cose da fare">
        <button role="tab" aria-selected={origine === 'mie'} className={`chip ${origine === 'mie' ? 'is-active' : ''}`} onClick={() => setOrigine('mie')}>
          Le mie <span className="n">{mieAperte}</span>
        </button>
        <button role="tab" aria-selected={origine === 'roadmap'} className={`chip ${origine === 'roadmap' ? 'is-active' : ''}`} onClick={() => setOrigine('roadmap')}>
          <BookOpen size={12} aria-hidden="true" /> Roadmap dal vault <span className="n">{roadmapAperte}</span>
        </button>
      </div>

      <div className="todos-bar">
        <input
          type="search" value={cerca} placeholder="Cerca fra le cose da fare" aria-label="Cerca fra le cose da fare"
          onChange={(e) => setCerca(e.target.value)}
        />
        <div className="chips" role="tablist" aria-label="Filtra">
          {FILTRI.map(f => (
            <button key={f.id} role="tab" aria-selected={filtro === f.id} className={`chip ${filtro === f.id ? 'is-active' : ''}`} onClick={() => setFiltro(f.id)}>
              {f.label}
            </button>
          ))}
          <button className={`chip ${mostraFatte ? 'is-active' : ''}`} aria-pressed={mostraFatte} onClick={() => setMostraFatte(v => !v)}>
            Mostra le fatte
          </button>
        </div>
      </div>

      {loading ? null : gruppi.length === 0 ? (
        <EmptyState
          title={origine === 'mie' && !mieAperte ? 'Niente di tuo da fare' : 'Niente che corrisponda'}
          hint={origine === 'mie' && !mieAperte
            ? 'Qui finiscono le cose che aggiungi tu, di solito con una data. Scegli un passo dalla roadmap e dagli una scadenza, o chiedi a Polpo di pianificare la settimana.'
            : 'Prova ad allargare i filtri o a svuotare la ricerca.'}
        />
      ) : (
        <div className="stack">
          {gruppi.map(({ progetto, righe: voci }) => {
            const chiuso = chiusi.has(progetto.id)
            const scad = voci.filter(v => v.scadenza && v.scadenza < oggi).length
            return (
              <section key={progetto.id} className="card card-flush todos-group">
                <div className="todos-group-head">
                  <button className="btn-icon sm" onClick={() => apriChiudi(progetto.id)} aria-expanded={!chiuso} aria-label={`${chiuso ? 'Apri' : 'Chiudi'} ${progetto.name}`}>
                    {chiuso ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <Link to={`/elementi/${progetto.id}`} className="todos-group-name">{progetto.name}</Link>
                  {scad > 0 && <span className="tag tag-invert">{scad} scadute</span>}
                  <span className="count" title={`${voci.length} aperte`}>{voci.length}</span>
                </div>

                {!chiuso && (
                  <ul>
                    {voci.map(r => {
                      const rel = r.scadenza ? relativeDay(r.scadenza) : null
                      return (
                        <li key={r.chiave}>
                          <label className={`todos-row ${r.fatta ? 'is-done' : ''}`}>
                            <input type="checkbox" checked={r.fatta} disabled={inCorso === r.chiave} onChange={() => spunta(r)} />
                            <span className="todos-text">{r.testo}</span>
                            {rel && (
                              <span className={`tag ${rel.tone === 'late' && !r.fatta ? 'tag-invert' : ''}`}>
                                {rel.text}{r.ora ? ` ${r.ora}` : ''}
                              </span>
                            )}
                          </label>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default TodosPage
