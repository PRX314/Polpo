// Le tre cose del giorno stanno in routines/{uid}.treCose, per data: { voci, proposte }.
export const MAX_TESTO = 120

// Da tre campi alle voci da salvare: una voce rimasta uguale tiene spunta e collegamento al progetto
export const vociDa = (testi, prima = []) => testi
  .map(t => t.trim().slice(0, MAX_TESTO))
  .filter(Boolean)
  .map(testo => prima.find(v => v.testo === testo) || { testo, fatta: false })
