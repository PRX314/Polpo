import { marked } from 'marked'
import DOMPurify from 'dompurify'

// Tutto ciò che arriva da un modello, dal vault o da un import passa da qui
// prima di finire in pagina come HTML.
marked.setOptions({ breaks: true, gfm: true })

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

export const renderMarkdown = (text) => (text ? DOMPurify.sanitize(marked.parse(String(text))) : '')
export const renderInline = (text) => (text ? DOMPurify.sanitize(marked.parseInline(String(text))) : '')
