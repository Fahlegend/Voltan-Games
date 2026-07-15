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

                const gameId = game.GameID || encodeURIComponent(game.GameTitle);
                
                // Get the relative image path directly from the JSON
                const imgPath = game.GameIMG; 

                card.innerHTML = `
                    <img src="${imgPath}"
                         alt="${game.GameTitle} Screenshot"
                         class="card-img"
                         onerror="this.outerHTML='<div class=\\'card-img-placeholder\\'>${game.GameTitle}</div>'">
                    <div class="card-content">
                        <h3>${game.GameTitle}</h3>
                        <p>${game.GameDescriptionShort}</p>
                        <a href="DynamicGame.html?id=${gameId}"
                           target="_self"
                           class="btn">
                             View Game Details
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

/**
 * Converts a structured JSON array of blocks into clean HTML.
 * Use this in your dynamic details script: 
 * detailsElement.innerHTML = renderLongDescription(game.longdescription);
 */
function renderLongDescription(blocks) {
    if (!blocks) return '';
    
    // Fallback if the longdescription is still a simple string in some JSON entries
    if (typeof blocks === 'string') {
        return `<p>${blocks}</p>`;
    }

    return blocks.map(block => {
        switch (block.type) {
            case 'paragraph':
                return `<p>${block.content}</p>`;
                
            case 'header':
                return `<h3>${block.content}</h3>`;
                
            case 'image':
                // Safe check if file is a video format
                const isVideo = block.src.match(/\.(mp4|webm|ogg|mov)$/i);
                
                if (isVideo) {
                    // Pull attributes dynamically from JSON properties, fallback to sensible defaults
                    const hasControls = block.controls !== false ? 'controls' : '';
                    const isAutoplay = block.autoplay === true ? 'autoplay' : '';
                    const isMuted = block.muted === true ? 'muted' : '';
                    const isLooping = block.loop === true ? 'loop' : '';

                    return `
                        <div class="description-media">
                            <video src="${block.src}" 
                                   class="desc-img parsed-media" 
                                   ${hasControls} 
                                   ${isAutoplay} 
                                   ${isMuted} 
                                   ${isLooping} 
                                   playsinline
                                   style="width: 100%; max-height: 500px; display: block; border-radius: 8px;">
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    `;
                } else {
                    return `
                        <div class="description-media">
                            <img src="${block.src}" 
                                 alt="${block.alt || 'Game Media'}" 
                                 class="desc-img parsed-media" 
                                 onerror="this.style.display='none'">
                        </div>
                    `;
                }
                
            case 'list':
                const listItems = block.items.map(item => `<li>${item}</li>`).join('');
                return `<ul>${listItems}</ul>`;
                
            case 'divider':
                return `<hr class="desc-divider">`;
                
            default:
                return '';
        }
    }).join('\n');
}