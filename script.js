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