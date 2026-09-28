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
// Un campione di silenzio: serve a sbloccare il lettore durante un clic (vedi sblocca()).
const SILENZIO = 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQIAAAAAAA==';

export class Eco {
  constructor({
    api = '',                      // prefisso degli endpoint: '' = stessa origine
    intestazioni = async () => ({}), // es. { Authorization: 'Bearer ...' }
    lingua = 'it-IT',
    ascolto = Riconoscimento ? 'browser' : 'whisper', // 'browser' | 'whisper'
    whisper = true,                // false = il server non ha /api/ascolta: niente ripiego
    voce = 'server',               // 'server' (edge/Piper) | 'browser' (speechSynthesis)
    paroleChiave = ['eco', 'echo', 'eko'],
    onStato = () => {},            // 'fermo' | 'ascolto' | 'penso' | 'parlo'
    onMessaggio = () => {},        // { chi: 'tu'|'eco'|'azione'|'errore', testo, ... }
    onLivello = () => {},          // volume del microfono 0..1, per le animazioni
    onDiario = () => {},           // cosa succede all'audio, per capire i problemi a distanza
    parametriVoce = async () => '', // es. '&k=<token>': un <audio src> non manda intestazioni
  } = {}) {
    Object.assign(this, { api, intestazioni, lingua, ascolto, whisper, voce, paroleChiave,
                          onStato, onMessaggio, onLivello, onDiario, parametriVoce });
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
  async turno(opzioni = {}) {
    this.zitto();
    const testo = await this.ascolta(opzioni);
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
  // fine: 'pausa' = si ferma da solo quando smetti di parlare;
  //       'manuale' = ascolta finché non chiami fermaAscolto() (secondo tocco, tasto rilasciato).
  async ascolta({ attesaMax = 8000, fine = 'pausa' } = {}) {
    this._fineAuto = fine !== 'manuale';
    this._imposta('ascolto');
    try {
      return this.ascolto === 'browser' && Riconoscimento
        ? await this._ascoltaBrowser(attesaMax) : await this._ascoltaWhisper(attesaMax);
    } finally {
      if (!this._maniLibere) this._imposta('fermo');
    }
  }

  fermaAscolto() { this._fermaAscolto?.(); }

  // Durante un ascolto partito "a pausa": da qui in poi niente fine automatica, si chiude
  // solo con fermaAscolto(). È il "tieni premuto" che scatta dopo che il tocco è già partito.
  tieniAperto() { this._fineAuto = false; }

  // Riconoscimento del browser: immediato e gratis (Chrome/Edge), niente server.
  // Sempre "continuo": a pausa ci si ferma alla prima frase finita, a mano si va avanti.
  _ascoltaBrowser(attesaMax) {
    return new Promise((risolvi) => {
      const r = new Riconoscimento();
      r.lang = this.lingua;
      r.continuous = true;
      r.interimResults = false;
      r.maxAlternatives = 1;
      const pezzi = [];
      let finito = false, chiuso = false, passaAWhisper = false, attesaFine = null;
      const limite = Date.now() + 120000;
      // Chiusura unica: la chiama "end", ma anche una scadenza se "end" non arriva. Dopo un
      // errore di rete Edge a volte non lo manda mai, e ECO restava fermo in ascolto per sempre.
      const chiudi = () => {
        if (chiuso) return;
        chiuso = true;
        clearTimeout(sicurezza); clearTimeout(silenzioIniziale); clearTimeout(attesaFine);
        this._fermaAscolto = null;
        // Riconoscimento del browser irraggiungibile: stesso turno, si continua con Whisper.
        if (passaAWhisper) risolvi(this._ascoltaWhisper(attesaMax));
        else risolvi(pezzi.join(' ').trim());
      };
      const chiudiPresto = () => { clearTimeout(attesaFine); attesaFine = setTimeout(chiudi, 1500); };
      const sicurezza = setTimeout(() => { finito = true; r.abort(); chiudiPresto(); }, 120000);
      const silenzioIniziale = attesaMax && setTimeout(() => {
        if (!pezzi.length && this._fineAuto) { finito = true; r.stop(); chiudiPresto(); }
      }, attesaMax);
      r.onresult = (e) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) pezzi.push(e.results[i][0].transcript.trim());
        }
        if (this._fineAuto) { finito = true; r.stop(); chiudiPresto(); }
      };
      r.onerror = (e) => {
        if (e.error === 'aborted') return; // l'hai fermato tu
        if (e.error !== 'no-speech') { finito = true; chiudiPresto(); }
        if (e.error === 'network' && this.whisper) {
          this.onMessaggio({ chi: 'errore', testo: 'Il riconoscimento di Edge non risponde: continuo con Whisper, ripeti pure.' });
          this.ascolto = 'whisper';
          passaAWhisper = true;
          chiudi();
        } else if (Eco.ERRORI_ASCOLTO[e.error] && (e.error !== 'no-speech' || this._fineAuto)) {
          this.onMessaggio({ chi: 'errore', testo: Eco.ERRORI_ASCOLTO[e.error] });
        }
      };
      r.onend = () => {
        // Il browser chiude da solo dopo un silenzio lungo: se stai parlando "a mano", riparte.
        if (!finito && !this._fineAuto && Date.now() < limite) {
          try { r.start(); return; } catch { /* non riparte: si chiude */ }
        }
        chiudi();
      };
      this._fermaAscolto = () => { finito = true; r.stop(); chiudiPresto(); };
      try {
        r.start();
      } catch {
        this.onMessaggio({ chi: 'errore', testo: 'Il microfono non è partito. Riprova.' });
        chiudi();
      }
    });
  }

  // Cosa può andare storto nel riconoscimento del browser, detto in chiaro. Senza, un
  // errore finiva in silenzio: toccavi il microfono e semplicemente non succedeva niente.
  static ERRORI_ASCOLTO = {
    'not-allowed': 'Microfono negato: consentilo a questo sito nelle impostazioni del browser.',
    'service-not-allowed': 'Riconoscimento vocale non permesso qui. Su iPhone controlla che la Dettatura sia attiva (Impostazioni › Generali › Tastiera).',
    'audio-capture': 'Nessun microfono disponibile.',
    'no-speech': 'Non ho sentito niente: tocca il microfono e parla subito.',
    'network': 'Il riconoscimento vocale del browser non è raggiungibile: serve la rete.',
    'language-not-supported': 'Questo browser non riconosce l\'italiano parlato.',
  };

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
    registratore.start(200); // un pezzo ogni 200 ms: servono per la trascrizione anticipata

    // Trascrizione anticipata: dopo 0,3 s di silenzio l'audio parte già verso Whisper; se
    // riprendi a parlare quella trascrizione si butta. Quando scattano gli 0,8 s che chiudono
    // la frase è già a metà strada: circa mezzo secondo risparmiato a ogni domanda.
    const trascrivi = (blob) => {
      const dati = new FormData();
      dati.append('audio', blob, 'voce.webm');
      return this._post('/api/ascolta', dati).then((r) => r.json()).then((j) => j.testo || '');
    };
    let anticipo = null;

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
          // Tetto a 0.03: se parli già mentre calibra, la voce non deve diventare "rumore"
          // (la soglia salirebbe sopra la voce stessa e non ti sentirebbe più).
          if (ora - inizio > 300) { calibrato = true; rumore = Math.min(Math.max(rumore * 2.5, 0.012), 0.03); }
        } else if (volume > rumore) {
          parlando = true; silenzioDa = 0; anticipo = null;
        } else if (parlando) {
          silenzioDa ||= ora;
          if (!anticipo && ora - silenzioDa > 300 && pezzi.length) {
            anticipo = trascrivi(new Blob(pezzi, { type: registratore.mimeType }));
            anticipo.catch(() => {}); // se va buttata, il suo eventuale errore non conta
          }
          // 1 s di silenzio = hai finito. Con 0,8 un'esitazione a metà frase ti tagliava;
          // grazie alla trascrizione anticipata i 0,2 s in più quasi non si sentono.
          if (this._fineAuto && ora - silenzioDa > 1000) ferma();
        } else if (this._fineAuto && attesaMax && ora - inizio > attesaMax) {
          ferma();
        }
        if (ora - inizio > (this._fineAuto ? 30000 : 120000)) ferma();
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

    this._imposta('penso');
    try {
      return await (anticipo ?? trascrivi(new Blob(pezzi, { type: registratore.mimeType })));
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
    if (this.voce === 'browser') await this._parlaBrowser(frasi);
    else await this._parlaServer(frasi);
    if (!this._maniLibere) this._imposta('fermo');
  }

  // Da chiamare DENTRO un clic o un tasto. I browser lasciano suonare una pagina solo
  // subito dopo un gesto (Edge in modalità "Limita": pochi secondi), ma la voce arriva 7-8 s
  // dopo il clic. Un lettore che ha già suonato durante un gesto resta sbloccato per sempre:
  // qui gli si fa suonare un attimo di silenzio. Come riserva si accende anche un
  // AudioContext, che una volta avviato da un gesto può suonare qualunque cosa più tardi.
  sblocca() {
    // Voce del browser (iOS): una frase muta detta durante il gesto sblocca quelle di dopo.
    if (this.voce === 'browser' && window.speechSynthesis) {
      const muta = new SpeechSynthesisUtterance(' ');
      muta.volume = 0;
      speechSynthesis.speak(muta);
      return;
    }
    this._lettore ??= new Audio();
    if (!this._sbloccato) {
      this._lettore.src = SILENZIO;
      this._lettore.play().then(() => { this._sbloccato = true; }, () => {});
    }
    try {
      this._contesto ??= new (window.AudioContext || window.webkitAudioContext)();
      if (this._contesto.state !== 'running') this._contesto.resume().catch(() => {});
    } catch { /* niente Web Audio: resta il lettore */ }
  }

  // Sempre lo stesso lettore (quello sbloccato). La prima frase suona a flusso mentre arriva;
  // le successive si scaricano subito in parallelo e sono pronte quando tocca a loro.
  async _parlaServer(frasi) {
    const extra = await this.parametriVoce();
    const indirizzo = (t) => `${this.api}/api/parla?t=${encodeURIComponent(t)}${extra}`;
    const scarica = (t) => fetch(indirizzo(t)).then((r) => (r.ok ? r.blob() : null)).catch(() => null);
    const successive = frasi.slice(1).map(scarica);
    this._lettore ??= new Audio();
    for (let i = 0; i < frasi.length && !this._interrotto; i++) {
      const blob = i ? await successive[i - 1] : null;
      if (i && !blob) continue;
      const sorgente = i ? URL.createObjectURL(blob) : indirizzo(frasi[0]);
      const suonata = await this._suona(sorgente);
      if (!suonata && !this._interrotto) await this._suonaConContesto(blob || await scarica(frasi[0]));
      if (i) URL.revokeObjectURL(sorgente);
    }
  }

  _suona(sorgente) {
    const l = this._lettore;
    this._audio = l;
    const inizio = performance.now();
    const tempo = () => `${((performance.now() - inizio) / 1000).toFixed(1)}s`;
    return new Promise((fatto) => {
      let chiusa = false;
      const risolvi = (esito) => { if (!chiusa) { chiusa = true; clearTimeout(scadenza); fatto(esito); } };
      // Se la frase non parte entro 8 s (rete ferma) si passa oltre invece di aspettare per sempre.
      const scadenza = setTimeout(() => {
        this.onDiario(`voce: dopo ${tempo()} non è ancora partita, la salto`);
        risolvi(true);
        l.pause();
      }, 8000);
      l.onplaying = () => {
        clearTimeout(scadenza);
        this.onDiario(`voce: suona dopo ${tempo()} (volume ${l.volume}, muto ${l.muted})`);
      };
      l.onended = () => { this.onDiario(`voce: finita dopo ${tempo()}`); risolvi(true); };
      l.onerror = () => { this.onDiario(`voce: errore del lettore ${l.error?.code} dopo ${tempo()}`); risolvi(false); };
      // A fine frase arriva prima "pause" e poi "ended": conta solo la pausa voluta (zitto).
      l.onpause = () => { if (this._interrotto) risolvi(true); };
      l.src = sorgente;
      l.play().catch((e) => {
        if (chiusa) return; // già saltata per la scadenza: non è un rifiuto del browser
        if (this._interrotto) return risolvi(true); // l'hai interrotta tu: niente riserva
        this.onDiario(`voce: il browser rifiuta di suonare (${e.name}), provo con Web Audio`);
        risolvi(false);
      });
    });
  }

  async _suonaConContesto(blob) {
    try {
      if (!blob || !this._contesto) throw new Error('niente riserva');
      // resume() senza un gesto recente può restare in sospeso per sempre: al massimo 1,5 s.
      if (this._contesto.state !== 'running') {
        await Promise.race([this._contesto.resume(), new Promise((r) => setTimeout(r, 1500))]);
      }
      if (this._contesto.state !== 'running') throw new Error('audio bloccato');
      const suono = await this._contesto.decodeAudioData(await blob.arrayBuffer());
      this.onDiario(`voce: Web Audio suona ${suono.duration.toFixed(1)}s`);
      await new Promise((risolvi) => {
        const s = this._contesto.createBufferSource();
        s.buffer = suono;
        s.connect(this._contesto.destination);
        s.onended = risolvi;
        this._sorgente = s;
        s.start();
      });
      this._sorgente = null;
    } catch (e) {
      this.onDiario(`voce: nemmeno Web Audio suona (${e.message})`);
      if (!this._avvisato) {
        this._avvisato = true;
        this.onMessaggio({ chi: 'errore', testo: 'Il browser non mi lascia parlare. Tocca il quadrato una volta e riprova, oppure scegli la voce "browser".' });
      }
    }
  }

  // Una frase alla volta: Chrome tronca le frasi lunghe dopo circa 15 secondi, e così
  // un'interruzione ferma subito anche le frasi che restano.
  async _parlaBrowser(frasi) {
    for (const testo of frasi) {
      if (this._interrotto) break;
      await new Promise((risolvi) => {
        const u = new SpeechSynthesisUtterance(testo);
        u.lang = this.lingua;
        u.voice = Eco.voceMigliore(this.lingua);
        u.rate = 1.05;
        // Safari a volte non manda "end": dopo un tempo ragionevole si passa oltre comunque
        const riserva = setTimeout(risolvi, 4000 + testo.length * 120);
        u.onend = u.onerror = () => { clearTimeout(riserva); risolvi(); };
        speechSynthesis.speak(u);
      });
    }
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
    try { this._sorgente?.stop(); } catch { /* già finita */ }
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
    // Whisper scrive "Eco," a inizio frase come "Ecco,": lo accettiamo solo così,
    // prima parola e virgola, che è il modo in cui si chiama qualcuno.
    const ecco = testo.match(/^\s*ecco\s*,\s*(.*)$/is);
    if (ecco && this.paroleChiave.includes('eco')) return ecco[1].trim();
    const parole = testo.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
    const i = parole.slice(0, 3).findIndex((p) => this.paroleChiave.includes(p));
    return i < 0 ? null : parole.slice(i + 1).join(' ');
  }
}
