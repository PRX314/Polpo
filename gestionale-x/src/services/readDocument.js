// Gli originali non vengono inviati a servizi AI. I modelli OCR vengono scaricati al primo utilizzo.
// pdf.js in build legacy: quella moderna usa API JavaScript che Safari su iPhone può non avere.

// Safari decodifica le foto HEIC dell'iPhone; altrove fallisce e l'originale resta comunque salvato.
async function imageToCanvas(blob) {
  const bitmap = await createImageBitmap(blob)
  const scale = Math.min(1, 4000 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()
  return canvas
}

export async function readDocument(files, progress) {
  let worker
  const parts = []
  const warnings = []
  const recognize = async blob => {
    if (!worker) {
      const { createWorker } = await import('tesseract.js')
      worker = await createWorker('ita+eng', 1, { logger: m => progress(`Lettura locale: ${Math.round((m.progress || 0) * 100)}%`) })
    }
    return (await worker.recognize(blob)).data.text
  }
  try {
    for (const file of files) {
      progress(`Leggo ${file.name}…`)
      try {
        let text = ''
        if (/^text\//.test(file.type) || /\.(txt|md|csv)$/i.test(file.name)) text = await file.blob.text()
        else if (/^image\/(jpeg|png|webp|bmp)$/.test(file.type)) text = await recognize(file.blob)
        else if (/^image\/hei[cf]$/.test(file.type) || /\.hei[cf]$/i.test(file.name)) {
          const canvas = await imageToCanvas(file.blob)
          try { text = await recognize(canvas) } finally { canvas.width = 0; canvas.height = 0 }
        }
        else if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
          const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
          const { default: workerUrl } = await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url')
          pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
          const task = pdfjs.getDocument({ data: await file.blob.arrayBuffer(), isEvalSupported: false })
          task.onPassword = () => task.destroy()
          try {
            const pdf = await task.promise
            if (pdf.numPages > 30) warnings.push(`${file.name}: lette solo le prime 30 pagine; originale completo conservato.`)
            for (let i = 1; i <= Math.min(pdf.numPages, 30); i++) {
              progress(`${file.name}: pagina ${i}/${pdf.numPages}`)
              const page = await pdf.getPage(i)
              const content = await page.getTextContent()
              let pageText = content.items.map(item => (item.str || '') + (item.hasEOL ? '\n' : ' ')).join('')
              if (pageText.trim().length < 30) {
                const base = page.getViewport({ scale: 1 })
                const viewport = page.getViewport({ scale: Math.min(2, 2000 / Math.max(base.width, base.height)) })
                const canvas = document.createElement('canvas')
                canvas.width = viewport.width; canvas.height = viewport.height
                await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
                pageText = await recognize(canvas)
                canvas.width = 0; canvas.height = 0
              }
              text += `\nPagina ${i}\n${pageText}\n`
              page.cleanup()
            }
          } finally { await task.destroy() }
        } else warnings.push(`${file.name}: originale salvato; per questo formato inserisci il testo a mano.`)
        if (text.trim()) parts.push(`--- ${file.name} ---\n${text.trim()}`)
      } catch { warnings.push(`${file.name}: lettura non riuscita. L’originale è salvato; puoi riprovare con rete disponibile, una foto più nitida o inserire il testo a mano.`) }
    }
  } finally { await worker?.terminate() }
  return { text: parts.join('\n\n').slice(0, 2000000), warnings }
}
