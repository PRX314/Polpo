import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, LayoutGrid, List, Plus, Search, SlidersHorizontal, X } from 'lucide-react'
import ProjectCard from '../components/ProjectCard'
import EmptyState from '../components/ui/EmptyState'
import { useData } from '../context/useData'
import { useUi } from '../context/useUi'
import { ITEM_TYPE_LIST } from '../itemTypes'
import { STATUS_LABEL, STATUS_LIST, progressOf } from '../lib/status'
import { exportProjectsCSV } from '../services/exportService'
import './ItemsPage.css'

const VIEW_KEY = 'gestionale-items-view'
const FONTI = { vault: 'Dal vault', scanner: 'Dal codice', mano: 'Scritti a mano' }
const SORTS = { date: 'Più recenti', name: 'Nome', progress: 'Avanzamento' }

const readView = () => {
  try { return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid' } catch { return 'grid' }
}

const ItemsPage = () => {
  const { items, projects, notes, tagCounts, loading } = useData()
  const { openForm } = useUi()
  const [params, setParams] = useSearchParams()
  const [view, setView] = useState(readView)
  const [showFilters, setShowFilters] = useState(false)

  // Filtri nell'indirizzo: il tasto Indietro li ripristina e un elenco filtrato si può linkare
  const q = params.get('q') || ''
  const type = params.get('type') || 'all'
  const status = params.get('status') || 'all'
  const fonte = params.get('fonte') || 'all'
  const tag = params.get('tag') || ''
  const sort = params.get('sort') || 'date'
  const archived = params.get('archived') === '1'

  const setParam = (key, value, emptyValues = ['', 'all']) => {
    setParams(prev => {
      const next = new URLSearchParams(prev)
      if (emptyValues.includes(value) || value === false) next.delete(key)
      else next.set(key, value === true ? '1' : value)
      return next
    }, { replace: true })
  }

  const changeView = (v) => {
    setView(v)
    try { localStorage.setItem(VIEW_KEY, v) } catch { /* storage non disponibile */ }
  }

  const active = useMemo(() => items.filter(p => !p.archived), [items])
  const hasArchived = useMemo(() => items.some(p => p.archived), [items])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return items
      .filter(p => {
        if (!!p.archived !== archived) return false
        if (type !== 'all' && p.type !== type) return false
        if (status !== 'all' && p.status !== status) return false
        if (fonte !== 'all' && (p.fonte || 'mano') !== fonte) return false
        if (tag && !p.tags?.includes(tag)) return false
        if (!query) return true
        // si cerca anche per nome di cartella e nota del vault, che non sono tag
        return [p.name, p.description, p.cartella, p.vaultNote].some(f => f?.toLowerCase().includes(query)) ||
          p.tags?.some(t => t.toLowerCase().includes(query))
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
        if (sort === 'name') return (a.name || '').localeCompare(b.name || '')
        if (sort === 'progress') return progressOf(b).pct - progressOf(a).pct
        return new Date(b.createdAt) - new Date(a.createdAt)
      })
  }, [items, q, type, status, fonte, tag, sort, archived])

  const filtersOn = status !== 'all' || fonte !== 'all' || tag || sort !== 'date'
  const anyFilter = filtersOn || q || type !== 'all' || archived
  const resetAll = () => setParams({}, { replace: true })

  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="page-head">
        <div>
          <h1>Elementi</h1>
          <p className="sub">{loading ? 'Carico…' : `${filtered.length} di ${archived ? items.length - active.length : active.length}${archived ? ' archiviati' : ''}`}</p>
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => exportProjectsCSV(projects.filter(p => !p.archived), notes)}>
            <Download size={15} /> <span className="hide-sm">CSV</span>
          </button>
          <button className="btn btn-primary" onClick={() => openForm()}>
            <Plus size={15} /> Nuovo
          </button>
        </div>
      </div>

      <div className="chips" role="tablist" aria-label="Filtra per tipo">
        <button role="tab" aria-selected={type === 'all'} className={`chip ${type === 'all' ? 'is-active' : ''}`} onClick={() => setParam('type', 'all')}>
          Tutti <span className="n">{active.length}</span>
        </button>
        {ITEM_TYPE_LIST.map(t => {
          const n = active.filter(p => p.type === t.key).length
          if (!n) return null
          return (
            <button
              key={t.key} role="tab" aria-selected={type === t.key}
              className={`chip ${type === t.key ? 'is-active' : ''}`}
              onClick={() => setParam('type', type === t.key ? 'all' : t.key)}
            >
              {t.label} <span className="n">{n}</span>
            </button>
          )
        })}
      </div>

      <div className="items-toolbar">
        <div className="items-search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search" value={q} placeholder="Cerca negli elementi" aria-label="Cerca negli elementi"
            onChange={(e) => setParam('q', e.target.value)}
          />
        </div>
        {hasArchived && (
          <button className={`btn ${archived ? 'btn-primary' : ''}`} onClick={() => setParam('archived', !archived)} aria-pressed={archived}>
            Archivio
          </button>
        )}
        <button className={`btn ${showFilters || filtersOn ? 'btn-primary' : ''}`} onClick={() => setShowFilters(s => !s)} aria-expanded={showFilters}>
          <SlidersHorizontal size={15} /> <span className="hide-sm">Filtri</span>
          {filtersOn && <span className="count ghost" style={{ background: 'var(--bg)', color: 'var(--ink)' }}>•</span>}
        </button>
        <div className="seg" role="group" aria-label="Modo di visualizzazione">
          <button className={view === 'grid' ? 'is-on' : ''} onClick={() => changeView('grid')} aria-label="Griglia" aria-pressed={view === 'grid'}><LayoutGrid size={16} /></button>
          <button className={view === 'list' ? 'is-on' : ''} onClick={() => changeView('list')} aria-label="Lista" aria-pressed={view === 'list'}><List size={16} /></button>
        </div>
      </div>

      {showFilters && (
        <div className="card items-filters">
          <div className="field-row keep three">
            <div className="field">
              <label htmlFor="f-status">Stato</label>
              <select id="f-status" value={status} onChange={(e) => setParam('status', e.target.value)}>
                <option value="all">Tutti</option>
                {STATUS_LIST.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="f-fonte">Provenienza</label>
              <select id="f-fonte" value={fonte} onChange={(e) => setParam('fonte', e.target.value)}>
                <option value="all">Tutte</option>
                {Object.entries(FONTI).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="f-sort">Ordina per</label>
              <select id="f-sort" value={sort} onChange={(e) => setParam('sort', e.target.value, ['date'])}>
                {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          {tagCounts.length > 0 && (
            <div className="field">
              <span className="field-label">Tag</span>
              <div className="chips wrap">
                {tagCounts.slice(0, 20).map(([t, n]) => (
                  <button key={t} className={`chip ${tag === t ? 'is-active' : ''}`} onClick={() => setParam('tag', tag === t ? '' : t)}>
                    #{t} <span className="n">{n}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {anyFilter && !loading && (
        <div className="row row-wrap small muted">
          {tag && <span className="tag">#{tag} <button aria-label={`Togli il filtro #${tag}`} onClick={() => setParam('tag', '')}><X size={11} /></button></span>}
          <button className="btn btn-sm btn-quiet" onClick={resetAll}>Azzera filtri</button>
        </div>
      )}

      {loading ? (
        <div className="row" style={{ justifyContent: 'center', padding: 40 }}><span className="spinner" aria-hidden="true" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={anyFilter ? 'Nessun elemento corrisponde' : 'Ancora nessun elemento'}
          hint={anyFilter ? 'Prova ad allargare i filtri o a svuotare la ricerca.' : 'Crea il primo con “Nuovo”, oppure importa le note dal vault.'}
        >
          {anyFilter
            ? <button className="btn" style={{ marginTop: 12 }} onClick={resetAll}>Azzera filtri</button>
            : <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => openForm()}><Plus size={15} /> Nuovo elemento</button>}
        </EmptyState>
      ) : view === 'list' ? (
        <div className="items-list">
          {filtered.map(p => <ProjectCard key={p.id} project={p} compact />)}
        </div>
      ) : (
        <div className="items-grid">
          {filtered.map(p => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}
    </div>
  )
}

export default ItemsPage
