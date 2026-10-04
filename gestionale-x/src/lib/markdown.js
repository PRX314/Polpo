import { marked } from 'marked'
import DOMPurify from 'dompurify'

// Tutto ciò che arriva da un modello, dal vault o da un import passa da qui
// prima di finire in pagina come HTML.
marked.setOptions({ breaks: true, gfm: true })

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName !== 'A') return
  // Link a un elemento del gestionale (#/elementi/…): resta nell'app
  if ((node.getAttribute('href') || '').startsWith('#/')) {
    node.classList.add('link-el')
    node.removeAttribute('target')
    return
  }
  node.setAttribute('target', '_blank')
  node.setAttribute('rel', 'noopener noreferrer')
})

export const renderMarkdown = (text) => (text ? DOMPurify.sanitize(marked.parse(String(text))) : '')
export const renderInline = (text) => (text ? DOMPurify.sanitize(marked.parseInline(String(text))) : '')

// Elementi del gestionale per nome, per riconoscerli nel testo di Polpo
const normNome = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim()
export const indiceElementi = (elementi = []) => {
  const indice = new Map()
  // Gli archiviati per primi: se due hanno lo stesso nome vince quello attivo
  for (const p of [...elementi].sort((a, b) => Number(!!b.archived) - Number(!!a.archived))) {
    if (p?.name) indice.set(normNome(p.name), p)
  }
  return indice
}

// Polpo scrive i nomi degli elementi tra doppie quadre, come in Obsidian: [[Ungesto]].
// Se l'elemento esiste diventa un link alla sua pagina, altrimenti resta solo il nome.
export const collegaElementi = (testo, indice) => String(testo || '').replace(
  /\[\[([^\]\n|]{1,120})(?:\|([^\]\n]{1,120}))?\]\]/g,
  (_, nome, alias) => {
    const visibile = (alias || nome).trim().replace(/[[\]]/g, '')
    const p = indice?.get(normNome(nome))
    return p ? `[${visibile}](#/elementi/${encodeURIComponent(p.id)})` : visibile
  }
)
