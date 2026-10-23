import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Check, Eraser, ImagePlus, Pen, Redo2, Undo2, X } from 'lucide-react'
import './Lavagna.css'
import { COLORI, SFONDI, SPESSORI, disegnaSfondo, disegnaTratti, misure, preparaFoto, tratto } from './disegno'

// Lavagna a tutto schermo: si disegna col dito, con la penna o col mouse, su un foglio bianco,
// a righe, a quadretti o sopra una foto. I tratti si salvano come punti (si possono riprendere
// e modificare), più l'immagine finita per vederli subito nell'appunto.

export default function Lavagna({ iniziale, onSalva, onChiudi }) {
  const [tratti, setTratti] = useState(() => iniziale?.tratti || [])
  const [annullati, setAnnullati] = useState([])
  const [gomma, setGomma] = useState(false)
  const [colore, setColore] = useState(COLORI[0].value)
  const [spessore, setSpessore] = useState(SPESSORI[1])
  const [sfondo, setSfondo] = useState(iniziale?.sfondo || 'bianco')
  const [foto, setFoto] = useState(null) // { blob, bitmap }
  const [scala, setScala] = useState(0)
  const [salvo, setSalvo] = useState(false)
  const [errore, setErrore] = useState('')
  const sfondoRef = useRef(null)
  const inchiostroRef = useRef(null)
  const areaRef = useRef(null)
  const inCorso = useRef(null)
  const cambiato = useRef(false)

  const { w, h } = misure(sfondo === 'foto' ? foto?.bitmap : null)

  // La foto salvata in precedenza (si riapre un disegno fatto sopra una foto)
  useEffect(() => {
    if (!iniziale?.foto) return
    let vivo = true
    createImageBitmap(iniziale.foto).then(bitmap => { if (vivo) setFoto({ blob: iniziale.foto, bitmap }) }).catch(() => setErrore('Non riesco ad aprire la foto di sfondo'))
    return () => { vivo = false }
  }, [iniziale])

  // La pagina sotto non scorre mentre si disegna
  useEffect(() => {
    const prima = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prima }
  }, [])

  // Il foglio occupa tutto lo spazio libero tenendo le proporzioni
  useLayoutEffect(() => {
    const area = areaRef.current
    if (!area) return
    // clientWidth/Height comprendono i 10 px di margine per lato
    const misura = () => setScala(Math.max(0, Math.min((area.clientWidth - 20) / w, (area.clientHeight - 20) / h)))
    misura()
    const ro = new ResizeObserver(misura)
    ro.observe(area)
    return () => ro.disconnect()
  }, [w, h])

  useEffect(() => {
    const ctx = sfondoRef.current?.getContext('2d')
    if (ctx) disegnaSfondo(ctx, w, h, sfondo, foto?.bitmap)
  }, [w, h, sfondo, foto])

  const ridisegna = useCallback((lista) => {
    const ctx = inchiostroRef.current?.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, w, h)
    disegnaTratti(ctx, lista)
  }, [w, h])
  useEffect(() => { ridisegna(tratti) }, [tratti, ridisegna])

  const punto = (e) => {
    const r = inchiostroRef.current.getBoundingClientRect()
    return [Math.round((e.clientX - r.left) * (w / r.width)), Math.round((e.clientY - r.top) * (h / r.height))]
  }

  const giu = (e) => {
    if (inCorso.current) return // un dito alla volta: il palmo appoggiato non disegna
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    const t = { colore, spessore: gomma ? spessore * 2.5 : spessore, gomma, punti: punto(e) }
    inCorso.current = { id: e.pointerId, t }
    const ctx = inchiostroRef.current.getContext('2d')
    ctx.save(); tratto(ctx, t); ctx.restore()
  }
  const muovi = (e) => {
    const c = inCorso.current
    if (!c || c.id !== e.pointerId) return
    const p = c.t.punti
    const [x, y] = punto(e)
    if (Math.abs(x - p[p.length - 2]) + Math.abs(y - p[p.length - 1]) < 2) return
    const ctx = inchiostroRef.current.getContext('2d')
    ctx.save()
    tratto(ctx, { ...c.t, punti: [p[p.length - 2], p[p.length - 1], x, y] })
    ctx.restore()
    p.push(x, y)
  }
  const su = (e) => {
    const c = inCorso.current
    if (!c || c.id !== e.pointerId) return
    inCorso.current = null
    cambiato.current = true
    setTratti(lista => [...lista, c.t])
    setAnnullati([])
  }

  const annulla = () => {
    if (!tratti.length) return
    cambiato.current = true
    setAnnullati(a => [...a, tratti[tratti.length - 1]])
    setTratti(tratti.slice(0, -1))
  }
  const ripeti = () => {
    if (!annullati.length) return
    cambiato.current = true
    setTratti(t => [...t, annullati[annullati.length - 1]])
    setAnnullati(annullati.slice(0, -1))
  }

  const scegliFoto = async (file) => {
    setErrore('')
    try {
      const f = await preparaFoto(file)
      setFoto(f); setSfondo('foto')
      cambiato.current = true
    } catch {
      setErrore('Questa foto non si apre qui. Prova con un JPEG o uno screenshot.')
    }
  }

  const chiudi = () => {
    if (cambiato.current && !window.confirm('Uscire senza salvare il disegno?')) return
    onChiudi()
  }

  const salva = async () => {
    setSalvo(true)
    try {
      const c = document.createElement('canvas')
      c.width = w; c.height = h
      const ctx = c.getContext('2d')
      disegnaSfondo(ctx, w, h, sfondo, foto?.bitmap)
      ctx.drawImage(inchiostroRef.current, 0, 0)
      const conFoto = sfondo === 'foto' && foto
      const immagine = await new Promise(r => c.toBlob(r, conFoto ? 'image/jpeg' : 'image/png', 0.85))
      await onSalva({ tratti, sfondo: conFoto ? 'foto' : (sfondo === 'foto' ? 'bianco' : sfondo), foto: conFoto ? foto.blob : null, immagine })
    } catch (e) {
      setErrore(e?.message || 'Salvataggio non riuscito')
      setSalvo(false)
    }
  }

  return (
    <div className="lav" role="dialog" aria-modal="true" aria-label="Lavagna">
      <div className="lav-barra">
        <button type="button" className="btn-icon" onClick={chiudi} aria-label="Chiudi la lavagna"><X size={18} /></button>
        <div className="seg" role="group" aria-label="Strumento">
          <button type="button" className={!gomma ? 'is-on' : ''} aria-pressed={!gomma} onClick={() => setGomma(false)} aria-label="Penna"><Pen size={16} /></button>
          <button type="button" className={gomma ? 'is-on' : ''} aria-pressed={gomma} onClick={() => setGomma(true)} aria-label="Gomma"><Eraser size={16} /></button>
        </div>
        <div className="seg">
          <button type="button" onClick={annulla} disabled={!tratti.length} aria-label="Annulla"><Undo2 size={16} /></button>
          <button type="button" onClick={ripeti} disabled={!annullati.length} aria-label="Ripeti"><Redo2 size={16} /></button>
        </div>
        <span className="grow" />
        <button type="button" className="btn btn-primary" onClick={salva} disabled={salvo}><Check size={16} /> {salvo ? 'Salvo…' : 'Salva'}</button>
      </div>
      <div className="lav-barra lav-barra-2">
        <div className="lav-colori" role="group" aria-label="Colore">
          {COLORI.map(c => (
            <button key={c.value} type="button" className={`lav-colore ${colore === c.value && !gomma ? 'is-on' : ''}`} style={{ '--c': c.value }}
              aria-label={c.label} aria-pressed={colore === c.value && !gomma} onClick={() => { setColore(c.value); setGomma(false) }} />
          ))}
        </div>
        <div className="lav-spessori" role="group" aria-label="Spessore">
          {SPESSORI.map(s => (
            <button key={s} type="button" className={`lav-spessore ${spessore === s ? 'is-on' : ''}`} aria-label={`Spessore ${s}`} aria-pressed={spessore === s} onClick={() => setSpessore(s)}>
              <span style={{ width: Math.max(3, s / 1.5), height: Math.max(3, s / 1.5) }} />
            </button>
          ))}
        </div>
        <select aria-label="Sfondo" value={sfondo} onChange={(e) => { setSfondo(e.target.value); cambiato.current = true }}>
          {Object.entries(SFONDI).filter(([k]) => k !== 'foto' || foto).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
        <label className="btn lav-foto">
          <ImagePlus size={16} /> Foto
          <input type="file" accept="image/*" aria-label="Disegna sopra una foto" onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; if (f) scegliFoto(f) }} />
        </label>
      </div>
      {errore && <p className="lav-errore small" role="alert">{errore}</p>}
      <div className="lav-area" ref={areaRef}>
        <div className="lav-foglio" style={{ width: w * scala, height: h * scala }}>
          <canvas ref={sfondoRef} width={w} height={h} aria-hidden="true" />
          <canvas ref={inchiostroRef} width={w} height={h} className="lav-inchiostro"
            onPointerDown={giu} onPointerMove={muovi} onPointerUp={su} onPointerCancel={su} aria-label="Foglio da disegno" />
        </div>
      </div>
    </div>
  )
}
