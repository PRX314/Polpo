// Copia di ECO/web/eco-client.js (Progetti Codice/ECO): la fonte è quella,
// se cambi qualcosa qui riportalo là e viceversa.
// ECO nel browser: orecchie, bocca e filo verso un cervello remoto.
// Nessuna dipendenza e nessun framework: la stessa classe gira nella pagina locale
// di ECO (cervello = server.py sul PC) e potrà girare nel Gestionale X
// (cervello = backend su Render, con `intestazioni` per il token Firebase).
//
//   const eco = new Eco({ api: '', onStato, onMessaggio, onLivello })
//   await eco.turno()            ascolta una frase, la manda, legge la risposta
//   await eco.invia('ciao')      salta l'ascolto
//   eco.maniLibere(true)         resta in ascolto, risponde a "Eco, ..."
//   eco.zitto()                  interrompe la voce (anche parlandogli sopra)

const Riconoscimento = window.SpeechRecognition || window.webkitSpeechRecognition;

export class Eco {
  constructor({
    api = '',                      // prefisso degli endpoint: '' = stessa origine
    intestazioni = async () => ({}), // es. { Authorization: 'Bearer ...' }
    lingua = 'it-IT',
    ascolto = Riconoscimento ? 'browser' : 'whisper', // 'browser' | 'whisper'
    voce = 'server',               // 'server' (edge/Piper) | 'browser' (speechSynthesis)
    paroleChiave = ['eco', 'echo', 'eko'],
    onStato = () => {},            // 'fermo' | 'ascolto' | 'penso' | 'parlo'
    onMessaggio = () => {},        // { chi: 'tu'|'eco'|'azione'|'errore', testo, ... }
    onLivello = () => {},          // volume del microfono 0..1, per le animazioni
  } = {}) {
    Object.assign(this, { api, intestazioni, lingua, ascolto, voce, paroleChiave,
                          onStato, onMessaggio, onLivello });
    this.stato = 'fermo';
    this._maniLibere = false;
    this._ultimoScambio = 0;
    this._audio = null;
    this._interrotto = false;
    this._fermaAscolto = null;
  }

  // --- rete ------------------------------------------------------------------
  async _post(percorso, corpo) {
    const eJson = !(corpo instanceof FormData);
    const risposta = await fetch(this.api + percorso, {
      method: 'POST',
      headers: { ...(eJson ? { 'Content-Type': 'application/json' } : {}),
                 ...(await this.intestazioni()) },
      body: eJson ? JSON.stringify(corpo) : corpo,
    });
    if (!risposta.ok) {
      let messaggio = `errore ${risposta.status}`;
      try { messaggio = (await risposta.json()).errore || messaggio; } catch { /* corpo non JSON */ }
      throw new Error(messaggio);
    }
    return risposta;
  }

  _imposta(stato) { this.stato = stato; this.onStato(stato); }

  // true se la voce è stata interrotta (tocco o Esc): chi aspetta la fine di parla() lo controlla
  get interrotto() { return this._interrotto; }

  // --- un giro completo --------------------------------------------------------
  async turno() {
    this.zitto();
    const testo = await this.ascolta();
    if (testo) await this.invia(testo);
  }

  async invia(testo) {
    this.zitto();
    this.onMessaggio({ chi: 'tu', testo });
    this._imposta('penso');
    try {
      const esito = await (await this._post('/api/chat', { testo })).json();
      for (const azione of esito.azioni || []) this.onMessaggio({ chi: 'azione', ...azione });
      this.onMessaggio({ chi: 'eco', testo: esito.testo, provider: esito.provider,
                         secondi: esito.secondi });
      await this.parla(esito.frasi?.length ? esito.frasi : [esito.testo]);
    } catch (e) {
      this.onMessaggio({ chi: 'errore', testo: e.message });
    }
    this._ultimoScambio = Date.now();
    if (!this._maniLibere) this._imposta('fermo');
  }

  async nuovaConversazione() { await this._post('/api/nuova', {}); }

  // --- orecchie ----------------------------------------------------------------
  async ascolta({ attesaMax = 8000 } = {}) {
    this._imposta('ascolto');
    try {
      return this.ascolto === 'browser' && Riconoscimento
        ? await this._ascoltaBrowser(attesaMax) : await this._ascoltaWhisper(attesaMax);
    } finally {
      if (!this._maniLibere) this._imposta('fermo');
    }
  }

  fermaAscolto() { this._fermaAscolto?.(); }

  // Riconoscimento del browser: immediato e gratis (Chrome/Edge), niente server.
  _ascoltaBrowser(attesaMax) {
    return new Promise((risolvi) => {
      const r = new Riconoscimento();
      r.lang = this.lingua;
      r.interimResults = false;
      r.maxAlternatives = 1;
      let testo = '';
      const timer = setTimeout(() => r.abort(), attesaMax + 15000);
      r.onresult = (e) => { testo = e.results[0][0].transcript.trim(); };
      r.onerror = (e) => {
        if (e.error === 'not-allowed') this.onMessaggio({ chi: 'errore', testo: 'Microfono negato.' });
        else if (e.error === 'network') {
          this.onMessaggio({ chi: 'errore', testo: 'Riconoscimento del browser offline: passo a Whisper.' });
          this.ascolto = 'whisper';
        }
      };
      r.onend = () => { clearTimeout(timer); this._fermaAscolto = null; risolvi(testo); };
      this._fermaAscolto = () => r.stop();
      r.start();
    });
  }

  // Registrazione con rilevamento del silenzio, poi Whisper sul server.
  async _ascoltaWhisper(attesaMax) {
    const flusso = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true } });
    const contesto = new AudioContext();
    const analisi = contesto.createAnalyser();
    analisi.fftSize = 1024;
    contesto.createMediaStreamSource(flusso).connect(analisi);
    const campioni = new Float32Array(analisi.fftSize);
    const registratore = new MediaRecorder(flusso);
    const pezzi = [];
    registratore.ondataavailable = (e) => e.data.size && pezzi.push(e.data);

    const fine = new Promise((risolvi) => { registratore.onstop = risolvi; });
    registratore.start();

    let rumore = 0.01, calibrato = false, parlando = false, silenzioDa = 0, fermato = false;
    const inizio = performance.now();
    const ferma = () => { if (!fermato) { fermato = true; registratore.stop(); } };
    this._fermaAscolto = () => { parlando = true; ferma(); };

    await new Promise((risolvi) => {
      const giro = () => {
        if (fermato) return risolvi();
        analisi.getFloatTimeDomainData(campioni);
        const volume = Math.sqrt(campioni.reduce((s, x) => s + x * x, 0) / campioni.length);
        this.onLivello(Math.min(1, volume * 12));
        const ora = performance.now();
        if (!calibrato) {  // primi 300 ms: misura il rumore di fondo
          rumore = Math.max(rumore, volume);
          if (ora - inizio > 300) { calibrato = true; rumore = Math.max(rumore * 2.5, 0.012); }
        } else if (volume > rumore) {
          parlando = true; silenzioDa = 0;
        } else if (parlando) {
          silenzioDa ||= ora;
          if (ora - silenzioDa > 1000) ferma();
        } else if (attesaMax && ora - inizio > attesaMax) {
          ferma();
        }
        if (ora - inizio > 30000) ferma();
        requestAnimationFrame(giro);
      };
      giro();
    });
    await fine;
    flusso.getTracks().forEach((t) => t.stop());
    contesto.close();
    this.onLivello(0);
    this._fermaAscolto = null;
    if (!parlando) return '';

    const dati = new FormData();
    dati.append('audio', new Blob(pezzi, { type: registratore.mimeType }), 'voce.webm');
    this._imposta('penso');
    try {
      return (await (await this._post('/api/ascolta', dati)).json()).testo || '';
    } catch (e) {
      this.onMessaggio({ chi: 'errore', testo: e.message });
      return '';
    }
  }

  // --- bocca ---------------------------------------------------------------------
  async parla(frasi) {
    if (typeof frasi === 'string') frasi = Eco.frasi(frasi);
    frasi = frasi.map(Eco.perVoce).filter(Boolean);
    if (!frasi.length) return;
    this._interrotto = false;
    this._imposta('parlo');
    if (this.voce === 'browser') await this._parlaBrowser(frasi.join(' '));
    else await this._parlaServer(frasi);
    if (!this._maniLibere) this._imposta('fermo');
  }

  // Chiede tutte le frasi subito: mentre suona la prima, le altre sono già in arrivo.
  async _parlaServer(frasi) {
    const inArrivo = frasi.map((testo) =>
      this._post('/api/parla', { testo }).then((r) => r.blob()).catch(() => null));
    for (const promessa of inArrivo) {
      if (this._interrotto) break;
      const blob = await promessa;
      if (!blob || this._interrotto) continue;
      const url = URL.createObjectURL(blob);
      this._audio = new Audio(url);
      await new Promise((risolvi) => {
        this._audio.onended = this._audio.onerror = this._audio.onpause = risolvi;
        this._audio.play().catch(risolvi);
      });
      URL.revokeObjectURL(url);
    }
    this._audio = null;
  }

  _parlaBrowser(testo) {
    return new Promise((risolvi) => {
      const u = new SpeechSynthesisUtterance(testo);
      u.lang = this.lingua;
      u.voice = Eco.voceMigliore(this.lingua);
      u.rate = 1.05;
      u.onend = u.onerror = risolvi;
      speechSynthesis.speak(u);
    });
  }

  // Preferisce le voci "Natural"/"Online" (Edge) a quelle robotiche di sistema.
  static voceMigliore(lingua) {
    const voci = speechSynthesis.getVoices().filter((v) => v.lang.startsWith(lingua.slice(0, 2)));
    return voci.find((v) => /natural/i.test(v.name)) || voci.find((v) => /online|google/i.test(v.name))
      || voci[0] || null;
  }

  zitto() {
    this._interrotto = true;
    if (this._audio) { this._audio.pause(); this._audio = null; }
    if (window.speechSynthesis?.speaking) speechSynthesis.cancel();
  }

  // --- testo per la voce ------------------------------------------------------
  static supportato() { return Boolean(Riconoscimento); }

  // Quello che una voce non deve leggere: markdown, link, emoji, blocchi di codice.
  static perVoce(testo) {
    return String(testo || '')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[*_#`>|~]+/g, '')
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  static frasi(testo) {
    return Eco.perVoce(testo).split(/(?<=[.!?;:])\s+/).filter((f) => /\p{L}|\p{N}/u.test(f));
  }

  // "sì" / "no" detti a voce, per confermare azioni. null = non ho capito.
  static risposta(testo) {
    const t = ' ' + String(testo || '').toLowerCase().replace(/[^\p{L}\s]/gu, ' ') + ' ';
    if (/ (no|annulla|lascia stare|non farlo|niente|stop) /.test(t)) return 'no';
    if (/ (s[iì]|certo|ok|okay|vai|conferma|confermo|procedi|fallo|esatto) /.test(t)) return 'si';
    return null;
  }

  // --- mani libere ---------------------------------------------------------------
  // Resta in ascolto a giro continuo; risponde solo se la frase comincia con la
  // parola chiave, oppure se arriva entro 8 secondi dall'ultima risposta.
  async maniLibere(attive) {
    this._maniLibere = attive;
    if (!attive) { this.fermaAscolto(); this.zitto(); this._imposta('fermo'); return; }
    while (this._maniLibere) {
      const testo = await this.ascolta({ attesaMax: 0 }).catch(() => '');
      if (!this._maniLibere) break;
      if (!testo) { await new Promise((r) => setTimeout(r, 200)); continue; }
      const seguito = Date.now() - this._ultimoScambio < 8000;
      const resto = this._dopoParolaChiave(testo);
      if (resto === null && !seguito) continue;
      await this.invia((resto ?? testo) || 'Ciao');
    }
  }

  _dopoParolaChiave(testo) {
    const parole = testo.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
    const i = parole.slice(0, 3).findIndex((p) => this.paroleChiave.includes(p));
    return i < 0 ? null : parole.slice(i + 1).join(' ');
  }
}
