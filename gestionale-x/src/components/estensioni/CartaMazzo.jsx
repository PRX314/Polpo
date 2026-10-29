import { useState } from 'react'
import './MazzoAnno.css'

// Una carta della stesa. Se l'immagine non arriva (in locale, o senza rete) resta il numero della carta.
// Chi la usa le dà una key che cambia con l'immagine, così una carta mancante non resta tale al giorno dopo.
const CartaMazzo = ({ carta, piccola }) => {
  const [rotta, setRotta] = useState(false)
  const conImmagine = carta.img && !rotta
  return (
    <figure className={`mz-carta ${carta.spenta ? 'is-spenta' : ''} ${piccola ? 'is-piccola' : ''}`}>
      {!piccola && <div className="mz-pos">{carta.pos}</div>}
      <div className={`mz-frame ${carta.spenta ? 'is-vuota' : ''}`}>
        {conImmagine
          ? <img src={carta.img} alt={piccola ? `${carta.pos}: ${carta.titolo}` : carta.titolo} loading="lazy" onError={() => setRotta(true)} />
          : <span className="mz-riserva" aria-hidden={!piccola}>{carta.riserva}</span>}
      </div>
      {!piccola && (
        <figcaption>
          <div className="mz-cn">{carta.titolo}</div>
          <div className="mz-cm">{carta.sotto}</div>
        </figcaption>
      )}
    </figure>
  )
}

export default CartaMazzo
