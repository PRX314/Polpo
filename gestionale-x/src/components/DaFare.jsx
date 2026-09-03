import { useMemo, useState } from 'react'
import { getTypeInfo } from '../itemTypes'

// Tutte le cose da fare, di tutti i progetti, in un posto solo.
//
// Serviva da quando il gestionale ha smesso di conoscere 5 progetti e ha
// iniziato a conoscerli tutti: le voci aperte sono passate da poche decine a
// oltre duecento, sparse in decine di schede. Sapere "cosa ho in sospeso"
// voleva dire aprirle una per una.

const pad = (n) => String(n).padStart(2, '0')
const oggiIso = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }

const fraGiorni = (n) => {
  const d = new Date(); d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const FILTRI = [
  { id: 'tutte', label: 'Tutte' },
  { id: 'scadute', label: 'Scadute' },
  { id: 'settimana', label: 'Questa settimana' },
  { id: 'conScadenza', label: 'Con scadenza' },
  { id: 'senzaScadenza', label: 'Senza scadenza' },
]

const DaFare = ({ projects, onProjectSelect, onUpdateProject }) => {
  const [filtro, setFiltro] = useState('tutte')
  const [cerca, setCerca] = useState('')
  const [mostraFatte, setMostraFatte] = useState(false)
  const [chiusi, setChiusi] = useState(() => new Set())
  const [inCorso, setInCorso] = useState(null)

  const oggi = oggiIso()
  const fraUnaSettimana = fraGiorni(7)

  // Una riga per ogni voce, con addosso il progetto da cui viene
  const righe = useMemo(() => {
    const out = []
    projects
      .filter(p => !p.archived)
      .forEach(p => {
        ;(p.todos || []).forEach((t, i) => {
          out.push({
            chiave: `${p.id}-${i}`,
            indice: i,
            progetto: p,
            testo: t.text || '',
            fatta: !!t.completed,
            scadenza: t.deadline || '',
            ora: t.time || '',
            daVault: !!t.daVault,
          })
        })
      })
    return out
  }, [projects])

  const visibili = useMemo(() => {
    const q = cerca.trim().toLowerCase()
    let r = righe.filter(x => mostraFatte || !x.fatta)

    if (filtro === 'scadute') r = r.filter(x => x.scadenza && x.scadenza < oggi)
    else if (filtro === 'settimana') r = r.filter(x => x.scadenza && x.scadenza >= oggi && x.scadenza <= fraUnaSettimana)
    else if (filtro === 'conScadenza') r = r.filter(x => x.scadenza)
    else if (filtro === 'senzaScadenza') r = r.filter(x => !x.scadenza)

    if (q) {
      r = r.filter(x =>
        x.testo.toLowerCase().includes(q) ||
        (x.progetto.name || '').toLowerCase().includes(q)
      )
    }
    return r
  }, [righe, filtro, cerca, mostraFatte, oggi, fraUnaSettimana])

  // Raggruppate per progetto: con oltre duecento voci un elenco piatto e'
  // illeggibile, e la maggior parte non ha una scadenza da cui ordinare.
  const gruppi = useMemo(() => {
    const m = new Map()
    for (const r of visibili) {
      if (!m.has(r.progetto.id)) m.set(r.progetto.id, { progetto: r.progetto, righe: [] })
      m.get(r.progetto.id).righe.push(r)
    }
    return [...m.values()].sort((a, b) => {
      // prima chi ha qualcosa di scaduto, poi chi ne ha di piu'
      const sA = a.righe.some(x => x.scadenza && x.scadenza < oggi) ? 1 : 0
      const sB = b.righe.some(x => x.scadenza && x.scadenza < oggi) ? 1 : 0
      if (sA !== sB) return sB - sA
      if (a.righe.length !== b.righe.length) return b.righe.length - a.righe.length
      return (a.progetto.name || '').localeCompare(b.progetto.name || '')
    })
  }, [visibili, oggi])

  const aperte = righe.filter(x => !x.fatta).length
  const scadute = righe.filter(x => !x.fatta && x.scadenza && x.scadenza < oggi).length
  const progettiConLavoro = new Set(righe.filter(x => !x.fatta).map(x => x.progetto.id)).size

  const spunta = async (riga) => {
    if (inCorso) return
    setInCorso(riga.chiave)
    try {
      const todos = (riga.progetto.todos || []).map((t, i) =>
        i === riga.indice ? { ...t, completed: !t.completed } : t
      )
      await onUpdateProject(riga.progetto.id, { todos })
    } finally {
      setInCorso(null)
    }
  }

  const apriChiudi = (id) => setChiusi(prev => {
    const n = new Set(prev)
    n.has(id) ? n.delete(id) : n.add(id)
    return n
  })

  const etichettaScadenza = (iso) => {
    if (!iso) return null
    const diff = Math.round((new Date(iso + 'T00:00:00') - new Date(oggi + 'T00:00:00')) / 86400000)
    if (diff < 0) return { testo: `${Math.abs(diff)}g fa`, cls: 'scaduta' }
    if (diff === 0) return { testo: 'oggi', cls: 'oggi' }
    if (diff === 1) return { testo: 'domani', cls: 'presto' }
    if (diff <= 7) return { testo: `tra ${diff}g`, cls: 'presto' }
    return { testo: new Date(iso + 'T00:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }), cls: '' }
  }

  return (
    <div>
      <div className="flex-between mb-4">
        <h2 className="title-section" style={{ marginBottom: 0 }}>✅ Da fare</h2>
        <span className="text-meta">
          {aperte} aperte in {progettiConLavoro} progetti
          {scadute > 0 && <span className="dafare-allarme"> · {scadute} scadute</span>}
        </span>
      </div>

      <div className="dafare-barra">
        <input
          type="text"
          className="search-field dafare-cerca"
          placeholder="Cerca fra le cose da fare…"
          value={cerca}
          onChange={(e) => setCerca(e.target.value)}
        />
        <div className="dafare-filtri">
          {FILTRI.map(f => (
            <button
              key={f.id}
              className={`toolbar-btn${filtro === f.id ? ' active' : ''}`}
              onClick={() => setFiltro(f.id)}
            >{f.label}</button>
          ))}
          <button
            className={`toolbar-btn${mostraFatte ? ' active' : ''}`}
            onClick={() => setMostraFatte(v => !v)}
            title="Mostra anche quelle già fatte"
          >Fatte</button>
        </div>
      </div>

      {gruppi.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🐙</div>
          <p>{righe.length === 0 ? 'Nessuna cosa da fare, da nessuna parte' : 'Niente che corrisponda'}</p>
          <p className="empty-state-hint">
            {righe.length === 0
              ? 'Le voci della roadmap nelle note del vault arrivano qui da sole a ogni sincronizzazione'
              : 'Prova ad allargare i filtri o a svuotare la ricerca'}
          </p>
        </div>
      ) : (
        <div className="dafare-gruppi">
          {gruppi.map(({ progetto, righe: voci }) => {
            const tipo = getTypeInfo(progetto.type)
            const chiuso = chiusi.has(progetto.id)
            const scad = voci.filter(v => v.scadenza && v.scadenza < oggi).length
            return (
              <div key={progetto.id} className="dafare-gruppo">
                <div className="dafare-gruppo-testa">
                  <button className="dafare-piega" onClick={() => apriChiudi(progetto.id)} title={chiuso ? 'Apri' : 'Chiudi'}>
                    {chiuso ? '▸' : '▾'}
                  </button>
                  <span className="dafare-tipo" style={{ color: tipo.color }}>{tipo.icon}</span>
                  <button className="dafare-nome" onClick={() => onProjectSelect(progetto)}>
                    {progetto.name}
                  </button>
                  <span className="dafare-conteggio">{voci.length}</span>
                  {scad > 0 && <span className="dafare-allarme">{scad} scadute</span>}
                </div>

                {!chiuso && (
                  <div className="dafare-voci">
                    {voci.map(r => {
                      const s = etichettaScadenza(r.scadenza)
                      return (
                        <label key={r.chiave} className={`dafare-voce${r.fatta ? ' fatta' : ''}`}>
                          <input
                            type="checkbox"
                            checked={r.fatta}
                            disabled={inCorso === r.chiave}
                            onChange={() => spunta(r)}
                          />
                          <span className="dafare-testo">{r.testo}</span>
                          {r.daVault && <span className="dafare-vault" title="Viene dalla roadmap nel vault">📓</span>}
                          {s && <span className={`dafare-scadenza ${s.cls}`}>{s.testo}{r.ora ? ` ${r.ora}` : ''}</span>}
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default DaFare
