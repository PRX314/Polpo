import './ScanInfo.css'

// Dati "Dal codice": arrivano dallo scanner locale Dietro i Progetti
// (campo `scan` sul documento del progetto). Sola lettura: si aggiornano
// solo rilanciando la scansione sul PC.

const SCAN_STATI = {
  attivo: { label: 'Attivo', cls: 'on' },
  fermo: { label: 'Fermo', cls: 'half' },
  dormiente: { label: 'Dormiente', cls: 'off' },
}

const statoInfo = (stato) => SCAN_STATI[stato] || SCAN_STATI.dormiente
const dataIt = (iso) => (iso ? new Date(iso).toLocaleDateString('it-IT') : null)

// Quadratino di stato del codice: pieno = attivo, mezzo = fermo, vuoto = dormiente
export const ScanDot = ({ scan, withLabel }) => {
  if (!scan) return null
  const info = statoInfo(scan.stato)
  const title = `Codice ${info.label.toLowerCase()}${scan.git?.ultimoCommit ? `, ultimo commit ${dataIt(scan.git.ultimoCommit)}` : ''}`
  return (
    <span className="scan-dot" title={title}>
      <span className={`scan-mark ${info.cls}`} aria-hidden="true" />
      {withLabel ? (scan.git?.ultimoCommit ? `commit ${dataIt(scan.git.ultimoCommit)}` : info.label.toLowerCase()) : <span className="sr-only">{title}</span>}
    </span>
  )
}

const Riga = ({ label, children }) => (
  <div className="scan-row">
    <dt>{label}</dt>
    <dd>{children}</dd>
  </div>
)

// Sezione completa per la vista dettaglio
const ScanInfo = ({ scan }) => {
  if (!scan) return null
  const info = statoInfo(scan.stato)
  const stack = [
    scan.stack?.frontend,
    ...(scan.stack?.framework || []),
    ...(scan.stack?.database || []),
    scan.stack?.hosting,
  ].filter(Boolean)

  return (
    <section className="card">
      <h2 className="card-title">
        <span>Dal codice</span>
        <span className="faint" style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>scansione del {dataIt(scan.aggiornatoIl)}</span>
      </h2>

      <dl className="scan-list">
        <Riga label="Stato">
          <span className="scan-dot"><span className={`scan-mark ${info.cls}`} aria-hidden="true" />{info.label}</span>
          {scan.ultimaModifica && <span className="faint"> · ultima modifica {dataIt(scan.ultimaModifica)}</span>}
        </Riga>

        {scan.git ? (
          <Riga label="Git">
            <code>{scan.git.branch}</code>
            {scan.git.ultimoCommit && <> · {dataIt(scan.git.ultimoCommit)}</>}
            {scan.git.messaggio && <> — “{scan.git.messaggio}”</>}
            {scan.git.modificheNonSalvate > 0 && <strong> · {scan.git.modificheNonSalvate} modifiche non salvate</strong>}
          </Riga>
        ) : (
          <Riga label="Git"><strong>nessun repository</strong></Riga>
        )}

        {scan.lancio && <Riga label="Si lancia con"><code>{scan.lancio}</code></Riga>}
        {stack.length > 0 && <Riga label="Stack">{stack.join(' · ')}</Riga>}
        {scan.stack?.dominio && (
          <Riga label="Online su">
            <a href={`https://${scan.stack.dominio}`} target="_blank" rel="noopener noreferrer">{scan.stack.dominio}</a>
          </Riga>
        )}
        <Riga label="Numeri">
          {scan.file} file · {(scan.linee || 0).toLocaleString('it-IT')} righe · {scan.funzioni} funzioni
          {scan.todo > 0 && <> · {scan.todo} TODO nel codice</>}
          {scan.sospetti > 0 && <> · {scan.sospetti} file sospetti</>}
        </Riga>
        {scan.linguaggi?.length > 0 && <Riga label="Linguaggi">{scan.linguaggi.join(' · ')}</Riga>}
        {scan.integrazioni?.length > 0 && <Riga label="Integrazioni">{scan.integrazioni.join(' · ')}</Riga>}
      </dl>
    </section>
  )
}

export default ScanInfo
