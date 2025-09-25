// Touch support for mobile devices
document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.project-card');

    // Add touch support for mobile
    cards.forEach(card => {
        let touchStarted = false;

        card.addEventListener('touchstart', function() {
            touchStarted = true;
            this.classList.add('touch-active');
        });

        card.addEventListener('touchend', function() {
            if (touchStarted) {
                // Toggle expanded state on mobile
                this.classList.toggle('mobile-expanded');
                touchStarted = false;
            }
            this.classList.remove('touch-active');
        });

        card.addEventListener('touchcancel', function() {
            touchStarted = false;
            this.classList.remove('touch-active');
        });
    });

    // Close other expanded cards when one is opened
    cards.forEach(card => {
        card.addEventListener('touchstart', function() {
            cards.forEach(otherCard => {
                if (otherCard !== this) {
                    otherCard.classList.remove('mobile-expanded');
                }
            });
        });
    });
});

// Polpo Long Press Handler
let polpoLongPressTimer;
let polpoPressed = false;

document.addEventListener('DOMContentLoaded', function() {
    const polpoLogo = document.getElementById('polpoLogo');
    const polpoModal = document.getElementById('polpoModal');

    if (!polpoLogo || !polpoModal) return;

    // Mouse events
    polpoLogo.addEventListener('mousedown', startPolpoPress);
    polpoLogo.addEventListener('mouseup', endPolpoPress);
    polpoLogo.addEventListener('mouseleave', endPolpoPress);

    // Touch events
    polpoLogo.addEventListener('touchstart', startPolpoPress);
    polpoLogo.addEventListener('touchend', endPolpoPress);
    polpoLogo.addEventListener('touchcancel', endPolpoPress);

    // Close modal when clicking outside
    polpoModal.addEventListener('click', function(e) {
        if (e.target === polpoModal) {
            closePolpoModal();
        }
    });

    function startPolpoPress(e) {
        e.preventDefault();
        polpoPressed = true;

        polpoLongPressTimer = setTimeout(() => {
            if (polpoPressed) {
                window.location.href = 'https://gestionalepolpo.netlify.app/';
            }
        }, 1500);
    }

    function endPolpoPress() {
        polpoPressed = false;
        if (polpoLongPressTimer) {
            clearTimeout(polpoLongPressTimer);
        }
    }
});

function openPolpoModal() {
    document.getElementById('polpoModal').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closePolpoModal() {
    document.getElementById('polpoModal').classList.remove('show');
    document.body.style.overflow = 'auto';
}