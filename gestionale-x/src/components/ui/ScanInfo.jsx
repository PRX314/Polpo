// Dati "Dal codice": arrivano dallo scanner locale Dietro i Progetti
// (campo `scan` sul documento del progetto). Sola lettura: si aggiornano
// solo rilanciando la scansione sul PC.

export const SCAN_STATI = {
  attivo:    { label: 'Attivo',    color: '#22c55e' },
  fermo:     { label: 'Fermo',     color: '#eab308' },
  dormiente: { label: 'Dormiente', color: '#9ca3af' },
}

const statoInfo = (stato) => SCAN_STATI[stato] || SCAN_STATI.dormiente

const dataIt = (iso) => iso ? new Date(iso).toLocaleDateString('it-IT') : null

// Pallino di stato del codice, per le card
export const ScanDot = ({ scan, withLabel }) => {
  if (!scan) return null
  const info = statoInfo(scan.stato)
  return (
    <span
      title={`Codice ${info.label.toLowerCase()}${scan.git?.ultimoCommit ? ` — ultimo commit ${dataIt(scan.git.ultimoCommit)}` : ''}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75em', color: 'var(--text-meta, #9ca3af)' }}
    >
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: info.color, display: 'inline-block', flexShrink: 0 }} />
      {withLabel && (scan.git?.ultimoCommit ? `commit ${dataIt(scan.git.ultimoCommit)}` : info.label.toLowerCase())}
    </span>
  )
}

const Riga = ({ label, children }) => (
  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'baseline' }}>
    <span style={{ fontSize: '0.7em', color: 'var(--text-meta, #9ca3af)', textTransform: 'uppercase', letterSpacing: '0.5px', width: '7.5rem', flexShrink: 0 }}>
      {label}
    </span>
    <span style={{ fontSize: '0.85em', color: 'var(--text-secondary, #6b7280)', lineHeight: 1.5, minWidth: 0 }}>
      {children}
    </span>
  </div>
)

// Sezione completa per la vista dettaglio
const ScanInfo = ({ scan }) => {
  if (!scan) return null
  const info = statoInfo(scan.stato)
  const stackParts = [
    scan.stack?.frontend,
    ...(scan.stack?.framework || []),
    ...(scan.stack?.database || []),
    scan.stack?.hosting,
  ].filter(Boolean)

  return (
    <div className="project-card mb-6">
      <div className="flex-between mb-4">
        <h3 className="title-section" style={{ margin: 0 }}>💻 Dal codice</h3>
        <span className="text-meta">
          scansione del {dataIt(scan.aggiornatoIl)} · sola lettura
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.85rem', borderRadius: '8px', background: 'var(--bg-card-hover, #f9fafb)' }}>
        <Riga label="Stato">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: info.color, display: 'inline-block' }} />
            {info.label}
            {scan.ultimaModifica && <span style={{ color: 'var(--text-meta, #9ca3af)' }}> · ultima modifica {dataIt(scan.ultimaModifica)}</span>}
          </span>
        </Riga>

        {scan.git ? (
          <Riga label="Git">
            <code style={{ fontSize: '0.95em' }}>{scan.git.branch}</code>
            {scan.git.ultimoCommit && <> · {dataIt(scan.git.ultimoCommit)}</>}
            {scan.git.messaggio && <> — “{scan.git.messaggio}”</>}
            {scan.git.modificheNonSalvate > 0 && (
              <span style={{ color: '#f59e0b' }}> · ⚠ {scan.git.modificheNonSalvate} modifiche non salvate</span>
            )}
          </Riga>
        ) : (
          <Riga label="Git"><span style={{ color: '#f59e0b' }}>⚠ nessun repository</span></Riga>
        )}

        {scan.lancio && (
          <Riga label="Si lancia con">
            <code style={{ fontSize: '0.95em', background: 'var(--bg-card, #fff)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>{scan.lancio}</code>
          </Riga>
        )}

        {stackParts.length > 0 && <Riga label="Stack">{stackParts.join(' · ')}</Riga>}

        {scan.stack?.dominio && (
          <Riga label="Online su">
            <a href={`https://${scan.stack.dominio}`} target="_blank" rel="noopener noreferrer">{scan.stack.dominio} ↗</a>
          </Riga>
        )}

        <Riga label="Numeri">
          {scan.file} file · {(scan.linee || 0).toLocaleString('it-IT')} righe · {scan.funzioni} funzioni
          {scan.todo > 0 && <> · {scan.todo} TODO nel codice</>}
          {scan.sospetti > 0 && <> · {scan.sospetti} file sospetti</>}
        </Riga>

        {scan.linguaggi?.length > 0 && <Riga label="Linguaggi">{scan.linguaggi.join(' · ')}</Riga>}

        {scan.integrazioni?.length > 0 && <Riga label="Integrazioni">{scan.integrazioni.join(' · ')}</Riga>}
      </div>
    </div>
  )
}

export default ScanInfo
