import { Suspense } from 'react'
import { Link, NavLink, Navigate, useParams } from 'react-router-dom'
import { ESTENSIONI, estensione, useEstensioniInOggi } from '../estensioni'
import './EstensioniPage.css'

const Caricamento = () => (
  <div className="row" style={{ justifyContent: 'center', padding: 48 }}>
    <span className="spinner" aria-hidden="true" /> <span className="muted">Carico…</span>
  </div>
)

// La stessa barra delle sotto-sezioni di Progetti e Vita: l'elenco e un chip per ogni estensione
const Barra = () => (
  <nav className="subnav chips" aria-label="Estensioni">
    <NavLink to="/estensioni" end className={({ isActive }) => `chip ${isActive ? 'is-active' : ''}`}>Tutte</NavLink>
    {ESTENSIONI.map(e => (
      <NavLink key={e.id} to={`/estensioni/${e.id}`} className={({ isActive }) => `chip ${isActive ? 'is-active' : ''}`}>{e.nome}</NavLink>
    ))}
  </nav>
)

const Elenco = () => {
  const [inOggi, cambia] = useEstensioniInOggi()
  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="page-head">
        <div>
          <h1>Estensioni</h1>
          <p className="sub">Strumenti in più, fuori dalle quattro sezioni. Alcuni possono comparire anche in Oggi.</p>
        </div>
      </div>
      <ul className="est-lista">
        {ESTENSIONI.map(e => (
          <li key={e.id} className="card est-voce">
            <div className="grow stack" style={{ gap: 6 }}>
              <h2><Link to={`/estensioni/${e.id}`}>{e.nome}</Link></h2>
              <p className="small muted">{e.desc}</p>
              {e.Riquadro && (
                <label className="est-oggi small">
                  <input type="checkbox" checked={!!inOggi[e.id]} onChange={(ev) => cambia(e.id, ev.target.checked)} />
                  <span>{e.oggi}</span>
                </label>
              )}
            </div>
            <Link to={`/estensioni/${e.id}`} className="btn btn-primary">Apri</Link>
          </li>
        ))}
      </ul>
      <p className="help">Cosa compare in Oggi lo decidi per ogni dispositivo: sul telefono e sul computer si spunta una volta per ciascuno.</p>
    </div>
  )
}

const EstensioniPage = () => {
  const { id } = useParams()
  const e = id ? estensione(id) : null
  if (id && !e) return <Navigate to="/estensioni" replace />
  const Pagina = e?.Pagina
  return (
    <>
      <Barra />
      {Pagina ? <Suspense fallback={<Caricamento />}><Pagina /></Suspense> : <Elenco />}
    </>
  )
}

export default EstensioniPage
