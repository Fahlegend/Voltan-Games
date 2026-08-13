document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================
    // HAMBURGER MENU
    // ==========================================================
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const sidebar = document.getElementById('sidebar');
    const navLinks = sidebar ? sidebar.querySelectorAll('a') : [];

    if (hamburgerBtn && sidebar) {
        hamburgerBtn.addEventListener('click', (e) => {
            sidebar.classList.toggle('active');
            e.stopPropagation();
        });

        document.addEventListener('click', (e) => {
            if (
                sidebar.classList.contains('active') &&
                !sidebar.contains(e.target) &&
                e.target !== hamburgerBtn
            ) {
                sidebar.classList.remove('active');
            }
        });

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                sidebar.classList.remove('active');
            });
        });
    }

    // ==========================================================
    // DYNAMIC DATA LOADING (GAMES, SOCIALS & ABOUT US)
    // ==========================================================

    // Fetch and load Games
    fetch('GameData.json')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load GameData.json');
            return response.json();
        })
        .then(gamesData => {
            const gamesContainer = document.getElementById('games-container');
            if (!gamesContainer) return;

            gamesContainer.innerHTML = '';

            gamesData.forEach(game => {
                const card = document.createElement('div');
                card.className = 'card';
                const gameId = game.GameID || encodeURIComponent(game.GameTitle);
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
            refreshFadeObserver();
        })
        .catch(error => console.error('Error fetching game entries:', error));

    // Fetch and load Socials
    fetch('socials.json')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load socials.json');
            return response.json();
        })
        .then(socialsData => {
            const socialsContainer = document.getElementById('socials-container');
            if (!socialsContainer) return;

            socialsContainer.innerHTML = '';

            socialsData.forEach(social => {
                const card = document.createElement('div');
                card.className = 'card';

                card.innerHTML = `
                    <div class="card-content">
                        <h3>${social.SocialTitle}</h3>
                        <p style="font-size: 0.85rem; color: var(--primary-cyan, #00f0ff); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.5rem;">
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
            refreshFadeObserver();
        })
        .catch(error => console.error('Error fetching social entries:', error));

    // Fetch and load About Us Data
    fetch('about-us.json')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load about-us.json');
            return response.json();
        })
        .then(aboutData => {
            const introContainer = document.getElementById('about-intro-container');
            if (introContainer && aboutData.introParagraphs) {
                introContainer.innerHTML = aboutData.introParagraphs
                    .map(paragraph => `<p>${paragraph}</p>`)
                    .join('');
            }

            const teamContainer = document.getElementById('team-grid-container');
            if (teamContainer && aboutData.teamMembers) {
                teamContainer.innerHTML = '';
                aboutData.teamMembers.forEach(member => {
                    const memberDiv = document.createElement('div');
                    memberDiv.className = 'team-member fade-in';

                    const responsibilitiesList = (member.responsibilities || [])
                        .map(item => `<li>${item}</li>`)
                        .join('');

                    // Generate Dev Social Links if available
                    let socialsHTML = '';
                    if (member.socials && member.socials.length > 0) {
                        const links = member.socials
                            .map(s => `<a href="${s.url}" target="_blank" class="dev-social-btn">${s.platform}</a>`)
                            .join('');
                        socialsHTML = `<div class="dev-socials-container">${links}</div>`;
                    }

                    memberDiv.innerHTML = `
                        <h4>${member.name}</h4>
                        <p>${member.roleDescription || ''}</p>
                        <ul>${responsibilitiesList}</ul>
                        ${socialsHTML}
                    `;
                    teamContainer.appendChild(memberDiv);
                });
            }

            const goalsContainer = document.getElementById('about-goals-container');
            if (goalsContainer) {
                let goalsHTML = '';
                if (aboutData.goalsHeading) {
                    goalsHTML += `<h3 style="color:var(--primary-cyan, #00f0ff);text-align:center;margin-bottom:1.5rem;">${aboutData.goalsHeading}</h3>`;
                }
                if (aboutData.goalsParagraphs) {
                    goalsHTML += aboutData.goalsParagraphs
                        .map(p => `<p>${p}</p>`)
                        .join('');
                }
                goalsContainer.innerHTML = goalsHTML;
            }

            refreshFadeObserver();
        })
        .catch(error => console.error('Error fetching about-us entries:', error));

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

    refreshFadeObserver();
});

// Helper function outside DOMContentLoaded
function renderLongDescription(blocks) {
    if (!blocks) return '';
    if (typeof blocks === 'string') return `<p>${blocks}</p>`;

    return blocks.map(block => {
        switch (block.type) {
            case 'paragraph':
                return `<p>${block.content}</p>`;
            case 'header':
                return `<h3>${block.content}</h3>`;
            case 'image':
                const isVideo = block.src.match(/\.(mp4|webm|ogg|mov)$/i);
                if (isVideo) {
                    const hasControls = block.controls !== false ? 'controls' : '';
                    const isAutoplay = block.autoplay === true ? 'autoplay' : '';
                    const isMuted = block.muted === true ? 'muted' : '';
                    const isLooping = block.loop === true ? 'loop' : '';

                    return `
                        <div class="description-media">
                            <video src="${block.src}" class="desc-img parsed-media" ${hasControls} ${isAutoplay} ${isMuted} ${isLooping} playsinline style="width: 100%; max-height: 500px; display: block; border-radius: 8px;">
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    `;
                } else {
                    return `
                        <div class="description-media">
                            <img src="${block.src}" alt="${block.alt || 'Game Media'}" class="desc-img parsed-media" onerror="this.style.display='none'">
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