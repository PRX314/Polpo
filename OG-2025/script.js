// Olympic Captain Hub - Greek Vase Style JavaScript
class OlympicCaptainHub {
    constructor() {
        this.teamData = {
            teamName: '',
            captainName: '',
            members: [],
            challenges: [],
            strategyNotes: '',
            stats: {
                challengesCompleted: 0,
                totalPoints: 0,
                barsVisited: 0,
                morale: 100,
                energy: 85,
                strategy: 70
            }
        };
        
        this.maxMembers = 8;
        this.isTeamCreated = false;
        
        this.init();
    }

    init() {
        this.loadData();
        this.bindEvents();
        this.updateDisplay();
        this.initializeView();
    }

    initializeView() {
        if (this.teamData.teamName && this.teamData.captainName) {
            this.isTeamCreated = true;
            this.showDashboard();
        } else {
            this.showWelcome();
        }
    }

    bindEvents() {
        // Team creation
        document.getElementById('create-team-btn').addEventListener('click', () => {
            this.createTeam();
        });

        // Enter key for team creation
        document.getElementById('team-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.createTeam();
        });

        document.getElementById('captain-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.createTeam();
        });

        // Member management
        document.getElementById('add-member-btn').addEventListener('click', () => {
            this.addMember();
        });

        document.getElementById('new-member').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addMember();
        });

        // Captain tools
        document.getElementById('add-challenge').addEventListener('click', () => {
            this.showChallengeModal();
        });

        document.getElementById('rally-troops').addEventListener('click', () => {
            this.captainAction('rally');
        });

        document.getElementById('strategy-meeting').addEventListener('click', () => {
            this.captainAction('strategy');
        });

        document.getElementById('victory-horn').addEventListener('click', () => {
            this.captainAction('victory');
        });

        // Challenge modal
        document.getElementById('challenge-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitChallenge();
        });

        document.querySelector('.close').addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('cancel-challenge').addEventListener('click', () => {
            this.hideModal();
        });

        // Modal background click
        document.getElementById('challenge-modal').addEventListener('click', (e) => {
            if (e.target.id === 'challenge-modal') {
                this.hideModal();
            }
        });

        // Notes functionality
        document.getElementById('save-notes').addEventListener('click', () => {
            this.saveNotes();
        });

        // Auto-save notes
        document.getElementById('strategy-notes').addEventListener('input', () => {
            clearTimeout(this.notesTimeout);
            this.notesTimeout = setTimeout(() => {
                this.teamData.strategyNotes = document.getElementById('strategy-notes').value;
                this.saveData();
            }, 2000);
        });

        // Collapsible functionality
        this.initCollapsibles();
    }

    initCollapsibles() {
        const collapsibles = document.querySelectorAll('.collapsible');
        collapsibles.forEach(collapsible => {
            collapsible.addEventListener('click', function() {
                const content = this.nextElementSibling;
                content.classList.toggle('active');
                
                // Animate the collapsible button
                this.style.transform = content.classList.contains('active') ? 
                    'translateX(5px)' : 'translateX(0)';
            });
        });
    }

    createTeam() {
        const teamName = document.getElementById('team-name').value.trim();
        const captainName = document.getElementById('captain-name').value.trim();

        if (!teamName || !captainName) {
            this.showFeedback('⚠️ Campi Obbligatori', 'Inserisci il nome della squadra e del capitano per fondare la tua dinastia olimpica!');
            return;
        }

        if (teamName.length < 3) {
            this.showFeedback('⚠️ Nome Troppo Breve', 'Il nome della squadra deve essere degno dell\\'Olimpo! Almeno 3 caratteri.');
            return;
        }

        // Create the team
        this.teamData.teamName = teamName;
        this.teamData.captainName = captainName;
        this.teamData.members = [{ 
            name: captainName, 
            isCaptain: true,
            joinedAt: new Date().toISOString()
        }];
        this.isTeamCreated = true;

        this.saveData();
        this.showFeedback(
            '🏆 Dinastia Fondata!', 
            `La squadra olimpica "${teamName}" è stata fondata!\\nCapitano ${captainName}, che gli dèi ti benedicano nella tua missione!`
        );
        
        setTimeout(() => {
            this.showDashboard();
            this.updateDisplay();
        }, 3000);
    }

    showWelcome() {
        document.getElementById('welcome-section').style.display = 'block';
        document.getElementById('dashboard-section').style.display = 'none';
    }

    showDashboard() {
        document.getElementById('welcome-section').style.display = 'none';
        document.getElementById('dashboard-section').style.display = 'block';
    }

    addMember() {
        if (!this.isTeamCreated) {
            this.showFeedback('⚠️ Squadra Non Creata', 'Prima crea la squadra, poi potrai aggiungere i tuoi atleti!');
            return;
        }

        const newMemberName = document.getElementById('new-member').value.trim();
        
        if (!newMemberName) {
            this.showFeedback('⚠️ Nome Mancante', 'Inserisci il nome del nuovo atleta olimpico');
            return;
        }

        if (this.teamData.members.length >= this.maxMembers) {
            this.showFeedback('⚠️ Squadra Completa', `L'Olimpo permette massimo ${this.maxMembers} atleti per squadra`);
            return;
        }

        // Check duplicates
        const nameExists = this.teamData.members.some(member => 
            member.name.toLowerCase() === newMemberName.toLowerCase()
        );

        if (nameExists) {
            this.showFeedback('⚠️ Nome Duplicato', 'Questo atleta è già nella tua squadra olimpica!');
            return;
        }

        // Add member
        this.teamData.members.push({ 
            name: newMemberName, 
            isCaptain: false,
            joinedAt: new Date().toISOString()
        });
        
        document.getElementById('new-member').value = '';
        
        // Boost morale when adding members
        this.teamData.stats.morale = Math.min(100, this.teamData.stats.morale + 2);
        
        this.saveData();
        this.updateMembersList();
        this.updateStatusBars();
        
        this.showFeedback('⚡ Nuovo Atleta!', `${newMemberName} si è unito alla tua squadra olimpica! Il morale della squadra aumenta!`);
    }

    removeMember(index) {
        if (this.teamData.members[index].isCaptain) {
            this.showFeedback('⚠️ Azione Impossibile', 'Zeus non permette di rimuovere il capitano dalla squadra olimpica!');
            return;
        }

        const memberName = this.teamData.members[index].name;
        this.teamData.members.splice(index, 1);
        
        // Decrease morale when losing members
        this.teamData.stats.morale = Math.max(20, this.teamData.stats.morale - 5);
        
        this.saveData();
        this.updateMembersList();
        this.updateStatusBars();
        
        this.showFeedback('👋 Atleta Partito', `${memberName} ha lasciato la squadra olimpica. Il morale della squadra diminuisce.`);
    }

    showChallengeModal() {
        if (!this.isTeamCreated) {
            this.showFeedback('⚠️ Squadra Non Creata', 'Prima crea la squadra per poter registrare le sfide olimpiche!');
            return;
        }
        
        document.getElementById('challenge-modal').style.display = 'block';
        document.getElementById('bar-name').focus();
    }

    hideModal() {
        document.getElementById('challenge-modal').style.display = 'none';
        document.getElementById('challenge-form').reset();
    }

    submitChallenge() {
        const barName = document.getElementById('bar-name').value.trim();
        const challengeType = document.getElementById('challenge-type').value;
        const pointsEarned = parseInt(document.getElementById('points-earned').value) || 0;
        const notes = document.getElementById('challenge-notes').value.trim();

        if (!barName || !challengeType) {
            this.showFeedback('⚠️ Dati Mancanti', 'Specifica il tempio e il tipo di sfida olimpica completata!');
            return;
        }

        const challenge = {
            id: Date.now(),
            barName,
            challengeType,
            pointsEarned,
            notes,
            completedAt: new Date().toLocaleString('it-IT'),
            timestamp: Date.now()
        };

        this.teamData.challenges.push(challenge);
        this.updateChallengeStats(pointsEarned);

        this.hideModal();
        this.saveData();
        this.updateDisplay();

        const challengeTypeLabels = {
            quiz: '🧠 Quiz Olimpico',
            performance: '🎭 Performance Teatrale', 
            creativity: '🎨 Creatività Divina',
            penalty: '😅 Penitenze Goliardiche',
            code: '🔍 Enigmi Ancestrali',
            final: '🏆 Gran Finale'
        };

        this.showFeedback(
            '🎯 Sfida Registrata!', 
            `${challengeTypeLabels[challengeType]} completata al ${barName}!\\n+${pointsEarned} punti conquistati per la gloria olimpica!`
        );
    }

    updateChallengeStats(points) {
        this.teamData.stats.challengesCompleted++;
        this.teamData.stats.totalPoints += points;
        
        // Count unique bars/temples
        const uniqueBars = new Set(this.teamData.challenges.map(c => c.barName.toLowerCase()));
        this.teamData.stats.barsVisited = uniqueBars.size;

        // Update team stats based on performance
        if (points >= 80) {
            this.teamData.stats.morale = Math.min(100, this.teamData.stats.morale + 8);
            this.teamData.stats.energy = Math.min(100, this.teamData.stats.energy + 5);
        } else if (points >= 60) {
            this.teamData.stats.morale = Math.min(100, this.teamData.stats.morale + 4);
            this.teamData.stats.energy = Math.min(100, this.teamData.stats.energy + 2);
        } else if (points < 30) {
            this.teamData.stats.morale = Math.max(10, this.teamData.stats.morale - 5);
        }

        // Energy decreases with each challenge (fatigue)
        this.teamData.stats.energy = Math.max(5, this.teamData.stats.energy - 3);

        // Strategy improves with experience
        const strategyBonus = Math.floor(this.teamData.stats.challengesCompleted / 2);
        this.teamData.stats.strategy = Math.min(100, 50 + strategyBonus + (points / 5));
    }

    captainAction(action) {
        if (!this.isTeamCreated) {
            this.showFeedback('⚠️ Squadra Non Creata', 'Prima crea la squadra per usare i poteri del capitano!');
            return;
        }

        const actions = {
            rally: {
                title: '📢 RADUNO OLIMPICO!',
                message: 'Hai chiamato a raccolta tutti gli atleti olimpici!\\nLa loro determinazione cresce! Morale +12, Energia +8',
                effect: () => {
                    this.teamData.stats.morale = Math.min(100, this.teamData.stats.morale + 12);
                    this.teamData.stats.energy = Math.min(100, this.teamData.stats.energy + 8);
                }
            },
            strategy: {
                title: '🗺️ CONSIGLIO DI GUERRA!',
                message: 'Hai organizzato una riunione strategica degna di Atena!\\nLa saggezza tattica della squadra aumenta! Strategia +15, Morale +5',
                effect: () => {
                    this.teamData.stats.strategy = Math.min(100, this.teamData.stats.strategy + 15);
                    this.teamData.stats.morale = Math.min(100, this.teamData.stats.morale + 5);
                }
            },
            victory: {
                title: '🎺 SUONA LA VITTORIA!',
                message: 'Il suono della vittoria riecheggia nell\\'Olimpo!\\nGli dèi sorridono alla tua squadra! Morale al massimo!',
                effect: () => {
                    this.teamData.stats.morale = 100;
                    this.teamData.stats.energy = Math.min(100, this.teamData.stats.energy + 15);
                    this.teamData.stats.strategy = Math.min(100, this.teamData.stats.strategy + 5);
                }
            }
        };

        const selectedAction = actions[action];
        if (selectedAction) {
            selectedAction.effect();
            this.saveData();
            this.updateDisplay();
            this.showFeedback(selectedAction.title, selectedAction.message);
        }
    }

    saveNotes() {
        this.teamData.strategyNotes = document.getElementById('strategy-notes').value;
        this.saveData();
        this.showFeedback('📜 Note Archiviate!', 'Le tue strategie sono state salvate negli annali olimpici');
    }

    updateDisplay() {
        this.updateDashboardHeader();
        this.updateMembersList();
        this.updateStats();
        this.updateStatusBars();
        this.updateStrategyNotes();
    }

    updateDashboardHeader() {
        const teamNameDisplay = document.getElementById('team-name-display');
        const captainNameDisplay = document.getElementById('captain-name-display');
        
        if (teamNameDisplay) teamNameDisplay.textContent = this.teamData.teamName || '';
        if (captainNameDisplay) captainNameDisplay.textContent = this.teamData.captainName || '';
    }

    updateMembersList() {
        const membersList = document.getElementById('members-list');
        const memberCount = document.getElementById('member-count');
        
        if (!membersList) return;

        membersList.innerHTML = '';
        
        this.teamData.members.forEach((member, index) => {
            const memberCard = document.createElement('div');
            memberCard.className = `member-card ${member.isCaptain ? 'captain' : ''}`;
            
            memberCard.innerHTML = `
                <span>
                    ${member.name} 
                    ${member.isCaptain ? '<span class="captain-badge">Capitano</span>' : ''}
                </span>
                ${!member.isCaptain ? `<button class="remove-member" onclick="olympicHub.removeMember(${index})" title="Rimuovi atleta">×</button>` : ''}
            `;
            
            membersList.appendChild(memberCard);
        });

        if (memberCount) {
            memberCount.textContent = this.teamData.members.length;
        }

        // Update add member controls
        const addBtn = document.getElementById('add-member-btn');
        const newMemberInput = document.getElementById('new-member');
        
        if (this.teamData.members.length >= this.maxMembers) {
            addBtn.disabled = true;
            addBtn.textContent = '⚔️ Completa';
            newMemberInput.disabled = true;
            newMemberInput.placeholder = 'Squadra olimpica completa';
        } else {
            addBtn.disabled = false;
            addBtn.textContent = '➕';
            newMemberInput.disabled = false;
            newMemberInput.placeholder = 'Aggiungi nuovo atleta';
        }
    }

    updateStats() {
        const statsToUpdate = {
            'challenges-completed': this.teamData.stats.challengesCompleted,
            'total-points': this.teamData.stats.totalPoints,
            'bars-visited': this.teamData.stats.barsVisited
        };

        Object.entries(statsToUpdate).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                this.animateNumber(element, parseInt(element.textContent) || 0, value, 800);
            }
        });
    }

    updateStatusBars() {
        const statusBars = {
            'morale-bar': this.teamData.stats.morale,
            'energy-bar': this.teamData.stats.energy,
            'strategy-bar': this.teamData.stats.strategy
        };

        Object.entries(statusBars).forEach(([id, value]) => {
            const bar = document.getElementById(id);
            const statusValue = document.querySelector(`[data-status="${id}"]`) || 
                              document.querySelector('.status-value');
            
            if (bar) {
                // Smooth animation for status bars
                bar.style.transition = 'width 0.8s ease';
                bar.style.width = `${Math.max(0, Math.min(100, value))}%`;
            }
            
            // Update status values in the text
            const statusItems = document.querySelectorAll('.status-item');
            statusItems.forEach((item, index) => {
                const valueSpan = item.querySelector('.status-value');
                if (valueSpan) {
                    const values = [this.teamData.stats.morale, this.teamData.stats.energy, this.teamData.stats.strategy];
                    if (index < values.length) {
                        valueSpan.textContent = `${Math.round(values[index])}%`;
                    }
                }
            });
        });
    }

    updateStrategyNotes() {
        const notesTextarea = document.getElementById('strategy-notes');
        if (notesTextarea && !notesTextarea.matches(':focus')) {
            notesTextarea.value = this.teamData.strategyNotes || '';
        }
    }

    animateNumber(element, start, end, duration) {
        const range = end - start;
        const startTime = performance.now();
        
        const updateNumber = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (range * easedProgress));
            
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            } else {
                element.textContent = end; // Ensure final value is exact
            }
        };
        
        requestAnimationFrame(updateNumber);
    }

    showFeedback(title, message) {
        const overlay = document.getElementById('feedback-overlay');
        const titleElement = document.getElementById('feedback-title');
        const messageElement = document.getElementById('feedback-message');
        
        titleElement.textContent = title;
        messageElement.textContent = message.replace(/\\n/g, '\n');
        
        overlay.style.display = 'block';
        
        // Auto-hide after 4 seconds
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 4000);
        
        // Click to dismiss
        overlay.onclick = () => {
            overlay.style.display = 'none';
        };
    }

    saveData() {
        try {
            const dataToSave = {
                ...this.teamData,
                lastUpdated: new Date().toISOString(),
                version: '1.0'
            };
            localStorage.setItem('olympicCaptainHubData', JSON.stringify(dataToSave));
        } catch (error) {
            console.error('Errore nel salvataggio dei dati olimpici:', error);
        }
    }

    loadData() {
        try {
            const savedData = localStorage.getItem('olympicCaptainHubData');
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                // Merge with defaults to ensure all properties exist
                this.teamData = { ...this.teamData, ...parsedData };
                
                // Ensure stats object integrity
                this.teamData.stats = {
                    challengesCompleted: 0,
                    totalPoints: 0,
                    barsVisited: 0,
                    morale: 100,
                    energy: 85,
                    strategy: 70,
                    ...parsedData.stats
                };
            }
        } catch (error) {
            console.error('Errore nel caricamento dei dati olimpici:', error);
        }
    }

    // Utility methods for development and testing
    resetData() {
        if (confirm('⚠️ ATTENZIONE: Sei sicuro di voler resettare tutti i dati olimpici?\n\nQuesta azione cancellerà:\n- La squadra e tutti i membri\n- Tutte le sfide completate\n- Le statistiche e i punti\n- Le note strategiche\n\nL\'azione non può essere annullata.')) {
            localStorage.removeItem('olympicCaptainHubData');
            location.reload();
        }
    }

    exportData() {
        try {
            const exportData = {
                ...this.teamData,
                exportedAt: new Date().toISOString(),
                version: '1.0'
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `olimpiadi_${this.teamData.teamName || 'squadra'}_backup_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            this.showFeedback('💾 Backup Creato!', 'I dati della squadra olimpica sono stati esportati negli archivi eterni!');
        } catch (error) {
            console.error('Errore nell\'export:', error);
            this.showFeedback('❌ Errore Export', 'Non è stato possibile creare il backup dei dati');
        }
    }

    getTeamSummary() {
        return {
            teamName: this.teamData.teamName,
            captainName: this.teamData.captainName,
            memberCount: this.teamData.members.length,
            challengesCompleted: this.teamData.stats.challengesCompleted,
            totalPoints: this.teamData.stats.totalPoints,
            barsVisited: this.teamData.stats.barsVisited,
            teamMorale: this.teamData.stats.morale,
            lastUpdated: new Date().toLocaleString('it-IT')
        };
    }
}

// MOBILE FUNCTIONS
let activeMobileSection = null;
let mobileHub = null;

function toggleMobileSection(sectionName) {
    const section = document.getElementById('mobile-section-' + sectionName);
    const buttons = document.querySelectorAll('.secondary-btn');
    
    document.querySelectorAll('[id^="mobile-section-"]').forEach(s => s.style.display = 'none');
    
    if (activeMobileSection === sectionName) {
        activeMobileSection = null;
    } else {
        section.style.display = 'block';
        activeMobileSection = sectionName;
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function showMobileModal() {
    document.getElementById('challenge-modal').style.display = 'block';
}

function mobileAction(action) {
    if (mobileHub) mobileHub.captainAction(action);
}

function initMobileVersion() {
    // Mobile team creation
    document.getElementById('mobile-create-team').addEventListener('click', () => {
        const teamName = document.getElementById('mobile-team-name').value.trim();
        const captainName = document.getElementById('mobile-captain-name').value.trim();
        
        if (!teamName || !captainName) {
            alert('Inserisci nome squadra e capitano!');
            return;
        }
        
        // Use the main hub but update mobile UI
        olympicHub.teamData.teamName = teamName;
        olympicHub.teamData.captainName = captainName;
        olympicHub.teamData.members = [{ 
            name: captainName, 
            isCaptain: true,
            joinedAt: new Date().toISOString()
        }];
        olympicHub.isTeamCreated = true;
        olympicHub.saveData();
        
        updateMobileUI();
        document.getElementById('mobile-welcome').style.display = 'none';
        document.getElementById('mobile-dashboard').style.display = 'block';
    });
    
    // Mobile add member
    document.getElementById('mobile-add-member').addEventListener('click', () => {
        const memberName = document.getElementById('mobile-new-member').value.trim();
        if (!memberName) {
            alert('Inserisci nome membro!');
            return;
        }
        
        if (olympicHub.teamData.members.length >= 8) {
            alert('Squadra completa (max 8 membri)!');
            return;
        }
        
        olympicHub.teamData.members.push({
            name: memberName,
            isCaptain: false,
            joinedAt: new Date().toISOString()
        });
        
        document.getElementById('mobile-new-member').value = '';
        olympicHub.saveData();
        updateMobileUI();
    });
}

function updateMobileUI() {
    if (!olympicHub || !olympicHub.isTeamCreated) return;
    
    // Update team display
    document.getElementById('mobile-team-display').textContent = `🏆 ${olympicHub.teamData.teamName}`;
    
    // Update stats
    document.getElementById('mobile-challenges').innerHTML = `${olympicHub.teamData.stats.challengesCompleted} <span>sfide</span>`;
    document.getElementById('mobile-points').innerHTML = `${olympicHub.teamData.stats.totalPoints} <span>punti</span>`;
    document.getElementById('mobile-members').innerHTML = `${olympicHub.teamData.members.length} <span>membri</span>`;
    
    // Update members list
    const membersList = document.getElementById('mobile-members-list');
    membersList.innerHTML = '';
    
    olympicHub.teamData.members.forEach((member, index) => {
        const memberDiv = document.createElement('div');
        memberDiv.className = 'temple-item';
        memberDiv.innerHTML = `
            <strong>${member.name}</strong> 
            ${member.isCaptain ? '👑' : ''}
            ${!member.isCaptain ? `<span onclick="removeMobileMember(${index})" style="float: right; color: #dc3545; cursor: pointer;">❌</span>` : ''}
        `;
        membersList.appendChild(memberDiv);
    });
}

function removeMobileMember(index) {
    if (confirm('Rimuovere questo membro?')) {
        olympicHub.removeMember(index);
        updateMobileUI();
    }
}

// Initialize the Olympic Captain Hub when DOM is loaded
let olympicHub;

document.addEventListener('DOMContentLoaded', () => {
    // Check if mobile or desktop
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        document.getElementById('desktop-version').style.display = 'none';
        document.getElementById('mobile-version').style.display = 'block';
        initMobileVersion();
    } else {
        document.getElementById('mobile-version').style.display = 'none';
        document.getElementById('desktop-version').style.display = 'grid';
    }
    
    olympicHub = new OlympicCaptainHub();
    
    // Update mobile UI if team exists
    if (olympicHub.isTeamCreated && isMobile) {
        document.getElementById('mobile-welcome').style.display = 'none';
        document.getElementById('mobile-dashboard').style.display = 'block';
        updateMobileUI();
    }
    
    // Add keyboard shortcuts for power users
    document.addEventListener('keydown', (e) => {
        // Ctrl + Alt + R to reset (for development)
        if (e.ctrlKey && e.altKey && e.key === 'r') {
            e.preventDefault();
            olympicHub.resetData();
        }
        
        // Ctrl + Alt + E to export data
        if (e.ctrlKey && e.altKey && e.key === 'e') {
            e.preventDefault();
            olympicHub.exportData();
        }
        
        // Ctrl + Alt + S to show summary
        if (e.ctrlKey && e.altKey && e.key === 's') {
            e.preventDefault();
            console.log('📊 Riassunto Squadra Olimpica:', olympicHub.getTeamSummary());
        }
        
        // Escape to close modals and overlays
        if (e.key === 'Escape') {
            const modal = document.getElementById('challenge-modal');
            const overlay = document.getElementById('feedback-overlay');
            if (modal.style.display === 'block') {
                olympicHub.hideModal();
            }
            if (overlay.style.display === 'block') {
                overlay.style.display = 'none';
            }
        }
    });
    
    // Add some Greek vase easter eggs
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('greek-vase')) {
            e.target.style.transform = 'scale(1.3) rotate(360deg)';
            e.target.style.transition = 'transform 0.8s ease';
            setTimeout(() => {
                e.target.style.transform = 'scale(1)';
            }, 800);
        }
        
        if (e.target.classList.contains('olympic-flame')) {
            e.target.style.animation = 'flame 0.5s ease-in-out 3';
        }
    });
});

// Console commands for development (hidden from users but available for debugging)
window.olympicCommands = {
    reset: () => olympicHub.resetData(),
    export: () => olympicHub.exportData(),
    summary: () => console.table(olympicHub.getTeamSummary()),
    addPoints: (points) => {
        olympicHub.teamData.stats.totalPoints += points;
        olympicHub.updateDisplay();
        olympicHub.saveData();
        console.log(`Aggiunti ${points} punti olimpici!`);
    },
    setMorale: (value) => {
        olympicHub.teamData.stats.morale = Math.max(0, Math.min(100, value));
        olympicHub.updateDisplay();
        olympicHub.saveData();
        console.log(`Morale impostato a ${value}%`);
    },
    setEnergy: (value) => {
        olympicHub.teamData.stats.energy = Math.max(0, Math.min(100, value));
        olympicHub.updateDisplay();
        olympicHub.saveData();
        console.log(`Energia impostata a ${value}%`);
    },
    help: () => {
        console.log(`
🏺 Comandi Console Olimpici:
- olympicCommands.reset() - Resetta tutti i dati
- olympicCommands.export() - Esporta backup
- olympicCommands.summary() - Mostra riassunto squadra
- olympicCommands.addPoints(n) - Aggiungi punti
- olympicCommands.setMorale(n) - Imposta morale (0-100)
- olympicCommands.setEnergy(n) - Imposta energia (0-100)

⌨️  Scorciatoie da Tastiera:
- Ctrl+Alt+R - Reset dati
- Ctrl+Alt+E - Export backup
- Ctrl+Alt+S - Mostra riassunto in console
- Esc - Chiudi modali
        `);
    }
};

// Welcome message for developers
console.log('%c🏺 OLIMPIADI GOLIARDICHE - Hub dei Capitani', 
    'color: #daa520; font-size: 16px; font-weight: bold;');
console.log('%cVersione Greek Vase Style - Digitare olympicCommands.help() per i comandi disponibili', 
    'color: #666; font-size: 12px;');