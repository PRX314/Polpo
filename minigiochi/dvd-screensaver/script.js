class DVDScreensaver {
    constructor() {
        this.imageUpload = document.getElementById('imageUpload');
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.screensaverBtn = document.getElementById('screensaverBtn');
        this.screensaver = document.getElementById('screensaver');
        this.bouncingImage = document.getElementById('bouncing-image');
        this.controls = document.getElementById('controls');

        // Elementi per il gioco
        this.playerNameInput = document.getElementById('playerNameInput');
        this.addPlayerBtn = document.getElementById('addPlayerBtn');
        this.playersList = document.getElementById('playersList');
        this.setupSection = document.getElementById('setup-section');
        this.gameSection = document.getElementById('game-section');
        this.currentPlayerDisplay = document.getElementById('currentPlayer');
        this.scoreboard = document.getElementById('scoreboard');
        this.resetGameBtn = document.getElementById('resetGameBtn');
        this.betPointsContainer = document.getElementById('bet-points');
        this.turnIndicator = document.getElementById('turn-indicator');
        this.winnerNotification = document.getElementById('winner-notification');
        this.previewImage = document.getElementById('preview-image');

        this.isRunning = false;
        this.animationId = null;
        this.animating = false;
        this.gameMode = true; // true = game mode, false = screensaver only

        // Posizione e velocità dell'immagine
        this.x = 100;
        this.y = 100;
        this.speedX = 3;
        this.speedY = 2;

        // Dimensioni dell'immagine
        this.imageWidth = 200;
        this.imageHeight = 100;

        // Sistema di gioco
        this.players = [];
        this.currentPlayerIndex = 0;
        this.betPoints = [];
        this.gameActive = false;
        this.playerColors = ['#ff006e', '#06ffa5', '#3a86ff', '#8338ec', '#ffbe0b', '#dc2626'];

        this.init();
    }

    init() {
        this.imageUpload.addEventListener('change', this.handleImageUpload.bind(this));
        this.startBtn.addEventListener('click', this.start.bind(this));
        this.stopBtn.addEventListener('click', this.stop.bind(this));
        this.screensaverBtn.addEventListener('click', this.startScreensaverOnly.bind(this));

        // Eventi per il sistema di giocatori
        this.addPlayerBtn.addEventListener('click', this.addPlayer.bind(this));
        this.playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addPlayer();
        });
        this.resetGameBtn.addEventListener('click', this.resetGame.bind(this));

        // Tasto ESC per uscire dallo screensaver
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isRunning) {
                this.stop();
            }
        });

        // Click e touch per piazzare scommesse o uscire
        this.screensaver.addEventListener('click', this.handleScreensaverClick.bind(this));
        this.screensaver.addEventListener('touchstart', this.handleScreensaverTouch.bind(this), { passive: false });

        // Imposta un'immagine di default
        this.setDefaultImage();
        this.updateUI();

        // Imposta l'immagine di preview iniziale
        this.previewImage.src = this.bouncingImage.src;
    }

    addPlayer() {
        const name = this.playerNameInput.value.trim();
        if (name && this.players.length < 6) {
            this.players.push({
                name: name,
                score: 0,
                color: this.playerColors[this.players.length],
                id: Date.now()
            });
            this.playerNameInput.value = '';
            this.updatePlayersList();
            this.updateUI();
        }
    }

    removePlayer(playerId) {
        this.players = this.players.filter(p => p.id !== playerId);
        this.currentPlayerIndex = Math.min(this.currentPlayerIndex, this.players.length - 1);
        this.updatePlayersList();
        this.updateUI();
    }

    updatePlayersList() {
        this.playersList.innerHTML = '';
        this.players.forEach(player => {
            const playerTag = document.createElement('div');
            playerTag.className = 'player-tag';
            playerTag.style.background = player.color;
            playerTag.style.borderColor = player.color;
            playerTag.innerHTML = `
                ${player.name}
                <button class="remove-player" onclick="dvdGame.removePlayer(${player.id})">×</button>
            `;
            this.playersList.appendChild(playerTag);
        });
    }

    updateScoreboard() {
        this.scoreboard.innerHTML = '';
        const sortedPlayers = [...this.players].sort((a, b) => b.score - a.score);
        sortedPlayers.forEach(player => {
            const scoreItem = document.createElement('div');
            scoreItem.className = 'score-item';
            scoreItem.style.borderColor = player.color;
            scoreItem.innerHTML = `
                <span style="color: ${player.color}">${player.name}</span>
                <span>${player.score}</span>
            `;
            this.scoreboard.appendChild(scoreItem);
        });
    }

    updateUI() {
        const hasPlayers = this.players.length > 0;
        this.startBtn.disabled = !hasPlayers;
        // Il bottone screensaver è sempre abilitato
        this.screensaverBtn.disabled = false;

        if (hasPlayers && this.gameActive) {
            this.setupSection.classList.add('hidden');
            this.gameSection.classList.remove('hidden');
            this.updateCurrentPlayer();
            this.updateScoreboard();
        } else {
            this.setupSection.classList.remove('hidden');
            this.gameSection.classList.add('hidden');
        }
    }

    updateCurrentPlayer() {
        if (this.players.length > 0) {
            const currentPlayer = this.players[this.currentPlayerIndex];
            this.currentPlayerDisplay.textContent = `🎯 Turno di: ${currentPlayer.name}`;
            this.currentPlayerDisplay.style.color = currentPlayer.color;
            this.currentPlayerDisplay.style.borderColor = currentPlayer.color;

            if (this.isRunning && !this.animating) {
                // Controlla se il giocatore ha già scommesso
                const hasAlreadyBet = this.betPoints.find(bet => bet.playerId === currentPlayer.id);
                if (hasAlreadyBet) {
                    // Passa al prossimo giocatore che non ha ancora scommesso
                    this.findNextPlayerToBet();
                } else {
                    // Mostra brevemente l'indicatore di turno, poi nascondilo
                    this.turnIndicator.textContent = `🎯 ${currentPlayer.name} - Clicca sui bordi per scommettere!`;
                    this.turnIndicator.style.background = currentPlayer.color;
                    this.turnIndicator.classList.remove('hidden');

                    setTimeout(() => {
                        this.turnIndicator.classList.add('hidden');
                    }, 3000);
                }
            }
        }
    }

    findNextPlayerToBet() {
        let attempts = 0;
        while (attempts < this.players.length) {
            const currentPlayer = this.players[this.currentPlayerIndex];
            const hasAlreadyBet = this.betPoints.find(bet => bet.playerId === currentPlayer.id);

            if (!hasAlreadyBet) {
                // Mostra brevemente l'indicatore di turno, poi nascondilo
                this.turnIndicator.textContent = `🎯 ${currentPlayer.name} - Clicca sui bordi per scommettere!`;
                this.turnIndicator.style.background = currentPlayer.color;
                this.turnIndicator.classList.remove('hidden');

                setTimeout(() => {
                    this.turnIndicator.classList.add('hidden');
                }, 3000);
                return;
            }

            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
            attempts++;
        }

        // Tutti hanno scommesso
        this.startAnimation();
    }

    nextPlayer() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        this.updateCurrentPlayer();
    }

    resetGame() {
        this.players.forEach(player => player.score = 0);
        this.betPoints = [];
        this.currentPlayerIndex = 0;
        this.animating = false;
        this.clearBetPoints();
        this.updateUI();
    }

    setDefaultImage() {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ff006e';
        ctx.fillRect(0, 0, 200, 100);

        ctx.fillStyle = 'white';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('DVD', 100, 50);

        this.bouncingImage.src = canvas.toDataURL();
        this.previewImage.src = canvas.toDataURL();
        this.imageWidth = 200;
        this.imageHeight = 100;
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const maxWidth = 300;
                    const maxHeight = 200;
                    let { width, height } = img;

                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }

                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }

                    this.imageWidth = width;
                    this.imageHeight = height;
                    this.bouncingImage.style.width = width + 'px';
                    this.bouncingImage.style.height = height + 'px';
                };
                img.src = e.target.result;
                this.bouncingImage.src = e.target.result;
                this.previewImage.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    handleScreensaverClick(event) {
        this.handleScreensaverInteraction(event.clientX, event.clientY);
    }

    handleScreensaverTouch(event) {
        // Previeni lo scroll della pagina
        event.preventDefault();
        const touch = event.touches[0];
        this.handleScreensaverInteraction(touch.clientX, touch.clientY);
    }

    handleScreensaverInteraction(clientX, clientY) {
        if (!this.isRunning) return;

        // Se è in modalità solo screensaver, qualsiasi touch/click esce
        if (!this.gameMode) {
            this.stop();
            return;
        }

        // Se l'animazione è già in corso, qualsiasi touch/click esce
        if (this.animating) {
            this.stop();
            return;
        }

        // Se non ci sono giocatori, esci
        if (this.players.length === 0) {
            this.stop();
            return;
        }

        const rect = this.screensaver.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        // Controlla se il touch/click è vicino ai bordi (entro 50px)
        const borderThreshold = 50;
        const isNearBorder = x <= borderThreshold ||
                           x >= window.innerWidth - borderThreshold ||
                           y <= borderThreshold ||
                           y >= window.innerHeight - borderThreshold;

        if (isNearBorder) {
            this.placeBet(x, y);
        } else {
            // Touch/click al centro esce dal gioco
            this.stop();
        }
    }

    placeBet(x, y) {
        const currentPlayer = this.players[this.currentPlayerIndex];

        // Controlla se il giocatore ha già piazzato una scommessa
        const existingBet = this.betPoints.find(bet => bet.playerId === currentPlayer.id);
        if (existingBet) {
            // Il giocatore ha già scommesso, non può scommettere di nuovo
            return;
        }

        // Aggiungi nuova scommessa
        const bet = {
            x: x,
            y: y,
            playerId: currentPlayer.id,
            playerName: currentPlayer.name,
            color: currentPlayer.color
        };

        this.betPoints.push(bet);
        this.displayBetPoints();

        // Passa al prossimo giocatore che non ha ancora scommesso
        this.nextPlayer();

        // Se tutti i giocatori hanno scommesso, inizia l'animazione
        if (this.betPoints.length === this.players.length) {
            this.startAnimation();
        }
    }

    displayBetPoints() {
        this.clearBetPoints();

        this.betPoints.forEach(bet => {
            const betPoint = document.createElement('div');
            betPoint.className = 'bet-point';
            betPoint.style.left = bet.x + 'px';
            betPoint.style.top = bet.y + 'px';
            betPoint.style.borderColor = bet.color;
            betPoint.style.background = bet.color + '80'; // Aggiunge trasparenza
            betPoint.textContent = bet.playerName.charAt(0).toUpperCase();
            this.betPointsContainer.appendChild(betPoint);
        });
    }

    clearBetPoints() {
        this.betPointsContainer.innerHTML = '';
    }

    checkWinCondition(bounceX, bounceY) {
        const winDistance = 25; // Distanza in pixel per vincere

        this.betPoints.forEach(bet => {
            const distance = Math.sqrt(
                Math.pow(bounceX - bet.x, 2) + Math.pow(bounceY - bet.y, 2)
            );

            if (distance <= winDistance) {
                this.declareWinner(bet);
            }
        });
    }

    declareWinner(winningBet) {
        // Trova il giocatore vincente
        const winner = this.players.find(p => p.id === winningBet.playerId);
        if (winner) {
            winner.score++;

            // Mostra brevemente notifica di vittoria, poi nascondila
            this.winnerNotification.textContent = `🎉 ${winner.name} HA VINTO! 🎉`;
            this.winnerNotification.style.background = winner.color;
            this.winnerNotification.classList.remove('hidden');

            // Nascondi notifica dopo 2 secondi
            setTimeout(() => {
                this.winnerNotification.classList.add('hidden');
            }, 2000);

            // Rimuovi tutti i punti scommessa per ricominciare
            this.betPoints = [];
            this.clearBetPoints();

            // Reset per nuovo round
            this.currentPlayerIndex = 0;
            this.animating = false;

            // Aggiorna scoreboard
            this.updateScoreboard();

            // Aspetta 3 secondi e poi ricomincia
            setTimeout(() => {
                if (this.isRunning) {
                    // Ferma l'animazione e ricomincia il ciclo di scommesse
                    if (this.animationId) {
                        cancelAnimationFrame(this.animationId);
                        this.animationId = null;
                    }

                    // Nuova posizione iniziale
                    this.x = Math.random() * (window.innerWidth - this.imageWidth);
                    this.y = Math.random() * (window.innerHeight - this.imageHeight);
                    this.bouncingImage.style.left = this.x + 'px';
                    this.bouncingImage.style.top = this.y + 'px';

                    // Nuove velocità - Ridotte per essere più lente
                    this.speedX = (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random() * 1.5);
                    this.speedY = (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random() * 1.5);

                    // Reset turno
                    this.updateCurrentPlayer();
                }
            }, 3000);
        }
    }

    start() {
        if (this.isRunning || this.players.length === 0) return;

        this.isRunning = true;
        this.gameActive = true;
        this.gameMode = true;
        this.animating = false;
        this.screensaver.classList.remove('hidden');
        this.controls.classList.add('hidden');

        // Posizione iniziale casuale (fermo finché tutti non scommettono)
        this.x = Math.random() * (window.innerWidth - this.imageWidth);
        this.y = Math.random() * (window.innerHeight - this.imageHeight);

        // Velocità iniziale casuale (ma non si muove ancora) - Ridotta per essere più lenta
        this.speedX = (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random() * 1.5);
        this.speedY = (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random() * 1.5);

        // Reset scommesse
        this.betPoints = [];
        this.currentPlayerIndex = 0;
        this.clearBetPoints();

        this.updateCurrentPlayer();

        // Posiziona l'immagine ma non iniziare l'animazione
        this.bouncingImage.style.left = this.x + 'px';
        this.bouncingImage.style.top = this.y + 'px';

        // Nascondi tutti gli elementi UI durante lo screensaver
        this.hideUIElements();

        // Mostra brevemente messaggio per iniziare a scommettere, poi nascondilo
        this.turnIndicator.textContent = `🎯 ${this.players[0].name} - Clicca sui bordi per scommettere!`;
        this.turnIndicator.style.background = this.players[0].color;
        this.turnIndicator.classList.remove('hidden');

        setTimeout(() => {
            this.turnIndicator.classList.add('hidden');
        }, 3000); // Nasconde dopo 3 secondi
    }

    startAnimation() {
        // Inizia l'animazione solo quando tutti hanno scommesso
        this.animating = true;

        // Nascondi tutti gli elementi UI durante l'animazione
        this.hideUIElements();

        // Mostra brevemente messaggio di inizio, poi nascondilo
        this.turnIndicator.textContent = '🚀 Tutti hanno scommesso! Il gioco inizia!';
        this.turnIndicator.style.background = '#06ffa5';
        this.turnIndicator.classList.remove('hidden');

        setTimeout(() => {
            this.turnIndicator.classList.add('hidden');
            this.animate();
        }, 2000); // Aspetta 2 secondi prima di iniziare
    }

    startScreensaverOnly() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.gameActive = false;
        this.gameMode = false;
        this.animating = true;
        this.screensaver.classList.remove('hidden');
        this.controls.classList.add('hidden');

        // Posizione iniziale casuale
        this.x = Math.random() * (window.innerWidth - this.imageWidth);
        this.y = Math.random() * (window.innerHeight - this.imageHeight);

        // Velocità iniziale casuale - Ridotta per essere più lenta
        this.speedX = (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random() * 1.5);
        this.speedY = (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random() * 1.5);

        // Pulisci elementi di gioco
        this.betPoints = [];
        this.clearBetPoints();

        // Posiziona l'immagine e inizia subito l'animazione
        this.bouncingImage.style.left = this.x + 'px';
        this.bouncingImage.style.top = this.y + 'px';

        // Nascondi tutti gli elementi UI durante lo screensaver
        this.hideUIElements();

        // Inizia subito l'animazione
        this.animate();
    }

    hideUIElements() {
        // Nascondi tutti gli elementi UI durante lo screensaver
        this.turnIndicator.classList.add('hidden');
        this.winnerNotification.classList.add('hidden');
    }

    showUIElements() {
        // Mostra gli elementi UI quando necessario (ma solo brevemente)
        // Questa funzione viene chiamata solo quando serve mostrare qualcosa temporaneamente
    }

    stop() {
        this.isRunning = false;
        this.gameActive = false;
        this.animating = false;
        this.gameMode = true;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.screensaver.classList.add('hidden');
        this.controls.classList.remove('hidden');
        this.clearBetPoints();

        // Nascondi tutti gli elementi UI
        this.hideUIElements();

        this.updateUI();
    }

    animate() {
        if (!this.isRunning || !this.animating) return;

        // Aggiorna posizione
        this.x += this.speedX;
        this.y += this.speedY;

        let bounced = false;
        let bounceX = this.x;
        let bounceY = this.y;

        // Controllo collisioni con i bordi
        if (this.x <= 0 || this.x >= window.innerWidth - this.imageWidth) {
            this.speedX = -this.speedX;
            this.x = Math.max(0, Math.min(window.innerWidth - this.imageWidth, this.x));
            bounced = true;
            bounceX = this.x <= 0 ? 0 : window.innerWidth;
        }

        if (this.y <= 0 || this.y >= window.innerHeight - this.imageHeight) {
            this.speedY = -this.speedY;
            this.y = Math.max(0, Math.min(window.innerHeight - this.imageHeight, this.y));
            bounced = true;
            bounceY = this.y <= 0 ? 0 : window.innerHeight;
        }

        // Controlla condizione di vittoria quando rimbalza (solo in game mode)
        if (bounced && this.gameMode) {
            this.checkWinCondition(bounceX, bounceY);
        }

        // Varia leggermente la velocità quando rimbalza
        if (bounced) {
            this.speedX += (Math.random() - 0.5) * 0.3;
            this.speedY += (Math.random() - 0.5) * 0.3;

            // Mantieni velocità minima - Ridotta
            if (Math.abs(this.speedX) < 0.8) this.speedX = this.speedX > 0 ? 0.8 : -0.8;
            if (Math.abs(this.speedY) < 0.8) this.speedY = this.speedY > 0 ? 0.8 : -0.8;

            // Limita velocità massima - Ridotta per movimento più lento
            this.speedX = Math.max(-3, Math.min(3, this.speedX));
            this.speedY = Math.max(-3, Math.min(3, this.speedY));
        }

        // Aggiorna posizione dell'immagine
        this.bouncingImage.style.left = this.x + 'px';
        this.bouncingImage.style.top = this.y + 'px';

        this.animationId = requestAnimationFrame(this.animate.bind(this));
    }
}

// Variabile globale per l'accesso ai metodi
let dvdGame;

// Inizializza l'app quando la pagina è caricata
document.addEventListener('DOMContentLoaded', () => {
    dvdGame = new DVDScreensaver();
});