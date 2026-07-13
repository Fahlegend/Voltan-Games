document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================
    // HAMBURGER MENU
    // ==========================================================

    const hamburgerBtn = document.getElementById('hamburger-btn');
    const sidebar = document.getElementById('sidebar');
    const navLinks = sidebar.querySelectorAll('a');

    // Toggle sidebar
    hamburgerBtn.addEventListener('click', (e) => {
        sidebar.classList.toggle('active');
        e.stopPropagation();
    });

    // Close sidebar when clicking outside
    document.addEventListener('click', (e) => {

        if (
            sidebar.classList.contains('active') &&
            !sidebar.contains(e.target) &&
            e.target !== hamburgerBtn
        ) {
            sidebar.classList.remove('active');
        }

    });

    // Close sidebar after clicking a link
    navLinks.forEach(link => {

        link.addEventListener('click', () => {
            sidebar.classList.remove('active');
        });

    });


    // ==========================================================
    // DYNAMIC DATA LOADING (GAMES & SOCIALS)
    // ==========================================================

    // Fetch and load Games
    fetch('GameData.json')
        .then(response => {
            if (!response.ok) throw new Error('Network response statement for GameData was not ok');
            return response.json();
        })
        .then(gamesData => {
            const gamesContainer = document.getElementById('games-container');
            if (!gamesContainer) return;

            gamesContainer.innerHTML = ''; // Clear fallback contents

            gamesData.forEach(game => {
                const card = document.createElement('div');
                card.className = 'card';

                card.innerHTML = `
                    <img src="${game.GameIMG}"
                         alt="${game.GameTitle} Screenshot"
                         class="card-img"
                         onerror="this.outerHTML='<div class=\\'card-img-placeholder\\'>${game.GameIMG}</div>'">
                    <div class="card-content">
                        <h3>${game.GameTitle}</h3>
                        <p>${game.GameDescriptionShort}</p>
                        <a href="${game.ItchIOLink}"
                           target="_blank"
                           class="btn">
                            Get our game on itch.io
                        </a>
                    </div>
                `;
                gamesContainer.appendChild(card);
            });
            
            // Re-observe dynamic entries for scroll fade animation
            refreshFadeObserver();
        })
        .catch(error => console.error('Error fetching game entries:', error));

    // Fetch and load Socials
    fetch('socials.json')
        .then(response => {
            if (!response.ok) throw new Error('Network response statement for Socials was not ok');
            return response.json();
        })
        .then(socialsData => {
            const socialsContainer = document.getElementById('socials-container');
            if (!socialsContainer) return;

            socialsContainer.innerHTML = ''; // Clear placeholder contents

            socialsData.forEach(social => {
                const card = document.createElement('div');
                card.className = 'card';

                card.innerHTML = `
                    <div class="card-content">
                        <h3>${social.SocialTitle}</h3>
                        <p style="font-size: 0.85rem; color: var(--primary-cyan); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.5rem;">
                            ${social.SocialPlatform}
                        </p>
                        <p>${social.SocialDescription}</p>
                        <a href="${social.socialLink}"
                           target="_blank"
                           class="btn">
                            Visit our ${social.SocialPlatform}
                        </a>
                    </div>
                `;
                socialsContainer.appendChild(card);
            });

            // Re-observe dynamic entries for scroll fade animation
            refreshFadeObserver();
        })
        .catch(error => console.error('Error fetching social entries:', error));


    // ==========================================================
    // FADE-IN ANIMATIONS
    // ==========================================================

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    function refreshFadeObserver() {
        const fadeElements = document.querySelectorAll('.fade-in');
        fadeElements.forEach(element => {
            fadeObserver.observe(element);
        });
    }

    // Run initial execution loop for static page sections
    refreshFadeObserver();

});