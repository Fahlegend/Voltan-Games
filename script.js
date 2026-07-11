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
    // FADE-IN ANIMATIONS
    // ==========================================================

    const fadeElements = document.querySelectorAll('.fade-in');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const fadeObserver = new IntersectionObserver((entries) => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {
                entry.target.classList.add('visible');

                // Uncomment below if you only want the animation once.
                // fadeObserver.unobserve(entry.target);
            }

        });

    }, observerOptions);

    fadeElements.forEach(element => {
        fadeObserver.observe(element);
    });

});