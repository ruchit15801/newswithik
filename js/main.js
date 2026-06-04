document.addEventListener('DOMContentLoaded', () => {
    const gameGrid          = document.getElementById('game-grid');
    const recentGrid        = document.getElementById('recent-grid');
    const recentSection     = document.getElementById('recent-games-section');
    const searchInput       = document.getElementById('game-search');
    const categoryBtns      = document.querySelectorAll('.cat-btn');
    const paginationControls= document.getElementById('pagination-controls');
    const prevPageBtn       = document.getElementById('prev-page');
    const nextPageBtn       = document.getElementById('next-page');
    const pageInfo          = document.getElementById('page-info');

    let currentFilter = 'all';
    let searchQuery   = '';
    let currentPage   = 1;
    const itemsPerPage = 12;

    // ── Fast lookup maps ──
    let GAME_MAP = {};
    let SLUG_MAP = {};
    if (window.GAMES) {
        window.GAMES.forEach(g => {
            GAME_MAP[g.id] = g;
            if (g.slug) SLUG_MAP[g.slug] = g;
        });
    }

    // ── Card HTML builder (must be above first renderGames — const is not hoisted) ──
    const GENRE_CLASS = {
        action:'genre-action', strategy:'genre-strategy', sports:'genre-sports',
        racing:'genre-racing', puzzle:'genre-puzzle', arcade:'genre-arcade'
    };

    function buildCard(game, index, isRecent) {
        const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="#0A0A0E"/><text x="50%" y="45%" font-family="Bebas Neue, sans-serif" font-size="36" fill="#FFD700" text-anchor="middle" dominant-baseline="middle">${game.title}</text><text x="50%" y="62%" font-family="sans-serif" font-size="18" fill="#555" text-anchor="middle">▶ TAP TO PLAY</text></svg>`;
        const placeholder = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr)}`;
        const imgLoad  = index < 4 ? 'eager' : 'lazy';
        const imgDecode= index < 4 ? 'sync'  : 'async';
        const gClass   = GENRE_CLASS[game.category] || 'genre-default';
        const thumbSrc = game.thumbnail ? `/${game.thumbnail}` : placeholder;

        let badge = '';
        if (isRecent)             badge = '<div class="recent-badge-tag">⟳ Recent</div>';
        else if (index === 0)     badge = '<div class="featured-crown">★ Featured</div>';
        else if (game.isTrending) badge = '<div class="recent-badge-tag">🔥 Hot</div>';

        return `<div class="game-card" onclick="openGameDetails('${game.id}')">
            <div class="game-thumb">
                ${badge}
                <div class="genre-badge ${gClass}">${game.category}</div>
                <img src="${thumbSrc}" alt="${game.title}" width="400" height="400"
                     loading="${imgLoad}" decoding="${imgDecode}"
                     onerror="this.onerror=null; this.src='${placeholder}';">
                <div class="play-badge">▶</div>
            </div>
            <div class="game-info">
                <span class="title">${game.title}</span>
                <span class="sub">${game.category.toUpperCase()}</span>
            </div>
        </div>`;
    }

    function renderGames() {
        if (!gameGrid) return;

        if (!window.GAMES || !Array.isArray(window.GAMES) || window.GAMES.length === 0) {
            var hint = 'Expected script: js/games.js (same folder as index.html). Protocol: ' + location.protocol + ' — use http://127.0.0.1 with npx serve . if unsure.';
            console.error('[VHCTA Games] window.GAMES missing or empty.', hint);
            if (typeof window.__PlayNews_showGamesLoadError === 'function') {
                window.__PlayNews_showGamesLoadError('Games list not available (GAMES missing).', hint);
            } else {
                gameGrid.innerHTML = '<div class="loader">Games list failed to load. If you opened this file directly from disk, use a local server instead (for example: <code>npx serve .</code>) or refresh the page.</div>';
            }
            if (paginationControls) paginationControls.style.display = 'none';
            return;
        }

        let filtered = window.GAMES;

        if (currentFilter === 'trending') {
            filtered = filtered.filter(g => g.isTrending);
        } else if (currentFilter !== 'all') {
            filtered = filtered.filter(g => g.category === currentFilter);
        }

        if (searchQuery) {
            filtered = filtered.filter(g =>
                g.title.toLowerCase().includes(searchQuery) ||
                (g.category || '').toLowerCase().includes(searchQuery)
            );
        }

        if (filtered.length === 0) {
            gameGrid.innerHTML = '<div class="loader">No games found. Try a different search!</div>';
            if (paginationControls) paginationControls.style.display = 'none';
            return;
        }

        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        const start     = (currentPage - 1) * itemsPerPage;
        const paginated = filtered.slice(start, start + itemsPerPage);

        let html = '';
        paginated.forEach((game, i) => {
            html += buildCard(game, i, false);
            // Insert AD 2 after the first game ONLY on the first page when showing all games
            if (i === 0 && currentPage === 1 && currentFilter === 'all' && !searchQuery) {
                html += `
                <div class="ad-container ad-container-in-grid" style="min-height:120px;contain:layout style;">
                    <div class="ad-label">ADVERTISEMENT</div>
                    <!-- 101Di2 -->
                    <ins class="adsbygoogle"
                         style="display:block;min-height:100px;"
                         data-ad-client="ca-pub-2738438146721203"
                         data-ad-slot="2424772370"
                         data-ad-format="auto"
                         data-full-width-responsive="true"></ins>
                </div>`;
            }
        });
        gameGrid.innerHTML = html;

        // Initialize the injected Ad — use a delay for reliable DOM readiness
        if (currentPage === 1 && currentFilter === 'all' && !searchQuery) {
            setTimeout(() => {
                const adIns = gameGrid.querySelector('.ad-container-in-grid ins.adsbygoogle');
                if (adIns && !adIns.hasAttribute('data-adsbygoogle-status')) {
                    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
                }
            }, 300);
        }

        if (paginationControls) {
            if (totalPages > 1) {
                paginationControls.style.display = 'flex';
                if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
                if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
                if (nextPageBtn) nextPageBtn.disabled = currentPage === totalPages;
            } else {
                paginationControls.style.display = 'none';
            }
        }
    }

    function renderRecentGames() {
        if (!recentSection || !recentGrid) return;
        const recentSlugs = JSON.parse(localStorage.getItem('recent_games') || '[]');
        if (recentSlugs.length === 0) { recentSection.style.display = 'none'; return; }

        const recentGames = recentSlugs
            .map(key => SLUG_MAP[key] || GAME_MAP[key] || window.GAMES?.find(g => g.slug === key || g.id === key))
            .filter(Boolean)
            .slice(0, 4);

        if (recentGames.length === 0) { recentSection.style.display = 'none'; return; }

        recentSection.style.display = 'block';
        recentGrid.innerHTML = recentGames.map((game, i) => buildCard(game, i + 10, true)).join('');
    }

    // ── Initial render ──
    renderRecentGames();
    renderGames();

    // ── Debounced search ──
    if (searchInput) {
        let searchTimer = null;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                searchQuery = e.target.value.toLowerCase().trim();
                currentPage = 1;
                renderGames();
            }, 180);
        });
    }

    // ── Category filter ──
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.category === currentFilter) return;
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.category;
            currentPage   = 1;
            renderGames();
        });
    });

    // ── Pagination — defensive null checks ──
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderGames();
                const ctrl = document.querySelector('.controls');
                if (ctrl) ctrl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            currentPage++;
            renderGames();
            const ctrl = document.querySelector('.controls');
            if (ctrl) ctrl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    // ── Navigation — smart: Vercel clean URL in production, query param locally ──
    window.openGameDetails = (gameId) => {
        const game = GAME_MAP[gameId] || SLUG_MAP[gameId] || window.GAMES?.find(g => g.id === gameId);
        if (!game) return;

        // Save to recent
        const key = game.slug || game.id;
        let recent = JSON.parse(localStorage.getItem('recent_games') || '[]');
        recent = recent.filter(id => id !== key);
        recent.unshift(key);
        localStorage.setItem('recent_games', JSON.stringify(recent.slice(0, 8)));
        localStorage.setItem('vhcta_last_play', Date.now());

        // Detect environment: localhost uses query param; production uses clean /games/slug
        const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        const targetUrl = isLocal ? `/game-details.html?slug=${game.slug || game.id}` : `/games/${game.slug || game.id}`;

        let navigated = false;
        let adBreakFired = false;

        function goNext() {
            if (navigated) return;
            navigated = true;
            window.location.href = targetUrl;
        }

        if (typeof window.adBreak === 'function') {
            // Safety fallback ONLY fires if adBreak never calls adBreakDone at all
            // (e.g. SDK failed to load). If ad shows and user closes it,
            // adBreakDone handles navigation — no race condition.
            var adFallbackTimer = setTimeout(function() {
                if (!adBreakFired) goNext();
            }, 4000);

            window.adBreak({
                type: 'next',
                name: 'browse_game',
                beforeAd: function() {
                    // Ad is about to show — clear fallback timer, wait for user to close ad
                    clearTimeout(adFallbackTimer);
                },
                adBreakDone: function() {
                    adBreakFired = true;
                    clearTimeout(adFallbackTimer);
                    // Navigate ONLY after ad is dismissed/viewed/done
                    goNext();
                }
            });
        } else {
            goNext();
        }
    };

    // ── Coin system (safe — elements may not exist) ──
    const balanceAmountEl      = document.getElementById('balance-amount');
    const coinBalanceContainer = document.querySelector('.coin-balance');

    if (balanceAmountEl) {
        let coins = parseInt(localStorage.getItem('vhcta_coins'), 10) || 5;
        balanceAmountEl.textContent = coins;

        function addCoins(amount) {
            coins += amount;
            localStorage.setItem('vhcta_coins', coins);
            balanceAmountEl.textContent = coins;

            if (coinBalanceContainer) {
                coinBalanceContainer.classList.remove('coin-animate');
                void coinBalanceContainer.offsetWidth;
                coinBalanceContainer.classList.add('coin-animate');

                const floatEl = document.createElement('div');
                floatEl.className = 'coin-float';
                floatEl.textContent = `+${amount}`;
                coinBalanceContainer.appendChild(floatEl);
                setTimeout(() => floatEl.remove(), 1500);
            }
        }

        const lastPlayed = localStorage.getItem('vhcta_last_play');
        if (lastPlayed) {
            const timeDiff = Math.floor((Date.now() - parseInt(lastPlayed, 10)) / 1000);
            const earned   = Math.min(Math.floor(timeDiff / 3), 100);
            if (earned >= 5) setTimeout(() => addCoins(earned), 800);
            localStorage.removeItem('vhcta_last_play');
        }
    }
    // ── Categories Drag to Scroll ──
    const catWrapper = document.querySelector('.categories-wrapper');
    if (catWrapper) {
        let isDown = false;
        let startX;
        let scrollLeft;

        catWrapper.addEventListener('mousedown', (e) => {
            isDown = true;
            catWrapper.style.cursor = 'grabbing';
            startX = e.pageX - catWrapper.offsetLeft;
            scrollLeft = catWrapper.scrollLeft;
        });
        catWrapper.addEventListener('mouseleave', () => {
            isDown = false;
            catWrapper.style.cursor = 'grab';
        });
        catWrapper.addEventListener('mouseup', () => {
            isDown = false;
            catWrapper.style.cursor = 'grab';
        });
        catWrapper.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - catWrapper.offsetLeft;
            const walk = (x - startX) * 2; // Scroll speed multiplier
            catWrapper.scrollLeft = scrollLeft - walk;
        });
        // Initial cursor style
        catWrapper.style.cursor = 'grab';
    }
});
