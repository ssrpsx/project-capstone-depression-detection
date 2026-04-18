/* ══════════════════════════════════════════════
   help.js  –  JID Help & FAQ Page
   ══════════════════════════════════════════════ */

const token  = localStorage.getItem('jwt_token');
const userId = localStorage.getItem('user_id');

// ─── Auth Guard ─────────────────────────────
if (!token || !userId) {
    window.location.href = 'index.html';
}

// ─── Logout ─────────────────────────────────
const btnLogout = document.getElementById('nav-logout');
if (btnLogout) {
    btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = 'index.html';
    });
}

// ─── FAQ Accordion ───────────────────────────
const faqButtons = document.querySelectorAll('.faq-question');

faqButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
        const item   = btn.closest('.faq-item');
        const isOpen = item.classList.contains('open');

        // Close all items
        document.querySelectorAll('.faq-item').forEach((el) => {
            el.classList.remove('open');
            el.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        });

        // Toggle clicked item
        if (!isOpen) {
            item.classList.add('open');
            btn.setAttribute('aria-expanded', 'true');
        }
    });
});

// ─── Search / Filter ─────────────────────────
const searchInput  = document.getElementById('help-search');
const faqItems     = document.querySelectorAll('.faq-item');
const noResults    = document.getElementById('faq-no-results');

searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    let found = 0;

    faqItems.forEach((item) => {
        const questionText = item.querySelector('.faq-question span').textContent.toLowerCase();
        const answerText   = item.querySelector('.faq-answer')?.textContent.toLowerCase() || '';
        const matches = questionText.includes(query) || answerText.includes(query);

        item.style.display = matches ? '' : 'none';
        if (matches) found++;
    });

    noResults.style.display = (found === 0) ? '' : 'none';
});
