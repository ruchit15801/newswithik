// --- COIN SYSTEM LOGIC ---
function getCoins() {
    return parseInt(localStorage.getItem('vhcta_coins'), 10) || 5;
}
function setCoins(amount) {
    localStorage.setItem('vhcta_coins', amount);
    const balanceAmountEl = document.getElementById('balance-amount');
    if (balanceAmountEl) balanceAmountEl.textContent = amount;
}

// Global function for handling "Play Now" click with Rewarded Ad & Coins
window.handlePlayClick = function(gameId) {
    let coins = getCoins();
    const btn = document.getElementById('play-btn-main');
    
    // Cost to play is 10 coins
    if (coins >= 10) {
        // Deduct 10 coins and play!
        setCoins(coins - 10);
        window.location.href = '/play.html?id=' + gameId;
    } else {
        // Not enough coins! Show Rewarded Ad to earn 10 coins
        if (typeof window.adBreak === 'function') {
            // Fallback timer just in case adBreak is completely stubbed
            let adFailed = setTimeout(() => {
                setCoins(getCoins() + 10);
                if (btn) btn.innerHTML = 'Play Now (-10 🪙)';
            }, 3500);

            window.adBreak({
                type: 'reward',
                name: 'earn_coins_reward',
                beforeReward: function(showAdFn) {
                    clearTimeout(adFailed);
                    if (btn) btn.innerHTML = 'Loading Ad...';
                    showAdFn();
                },
                adDismissed: function() {
                    alert('You must watch the full video to earn 🪙 coins!');
                    if (btn) btn.innerHTML = 'Watch Ad for Coins (+10 🪙)';
                },
                adViewed: function() {
                    setCoins(getCoins() + 10);
                    // Automatically play after rewarding to keep it smooth!
                    setCoins(getCoins() - 10);
                    window.location.href = '/play.html?id=' + gameId;
                },
                adBreakDone: function(placementInfo) {
                    // Safety reset
                    if (btn && btn.innerHTML === 'Loading Ad...') {
                         btn.innerHTML = 'Watch Ad for Coins (+10 🪙)';
                    }
                }
            });
        } else {
            // AdBlocker fallback: give free coins so they aren't stuck
            setCoins(getCoins() + 10);
            if (btn) btn.innerHTML = 'Play Now (-10 🪙)';
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const detailsContent = document.getElementById('details-content');
    
    // 1. Get Slug from URL Path or Query Params
    const urlParams = new URLSearchParams(window.location.search);
    let slug = urlParams.get('slug');
    const gameId = urlParams.get('id');

    // If no slug in query, try to parse from the path: /games/slug-name
    if (!slug) {
        const pathParts = window.location.pathname.split('/');
        const gamesIndex = pathParts.indexOf('games');
        if (gamesIndex !== -1 && pathParts[gamesIndex + 1]) {
            slug = pathParts[gamesIndex + 1];
        }
    }

    if (!window.GAMES) {
        detailsContent.innerHTML = '<div class="loader">Metadata error. <a href="/index.html">Go back</a></div>';
        return;
    }

    // Attempt to find game by slug first, then fallback to ID
    let game;
    if (slug) {
        game = window.GAMES.find(g => g.slug === slug);
    } else if (gameId) {
        game = window.GAMES.find(g => g.id === gameId);
    }

    if (!game) {
        detailsContent.innerHTML = '<div class="loader">Game not found. <a href="/index.html">Go back to Home</a></div>';
        return;
    }

    // Dynamic Stats (Randomized for premium feel)
    const activeUsers = (Math.floor(Math.random() * 50000) + 10000).toLocaleString();

    // 100% reliable offline premium fallback if an image is missing
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="#0A0A0E"/><text x="50%" y="50%" font-family="Bebas Neue, sans-serif" font-size="50" fill="#FFD700" text-anchor="middle" dominant-baseline="middle">${game.title}</text></svg>`;
    const placeholder = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr)}`;
    // Use absolute root path for thumbnail — avoids breakage when URL is /games/slug
    const thumbSrc = game.thumbnail ? `/${game.thumbnail}` : placeholder;

    detailsContent.innerHTML = `
        <!-- AD 3: Top of Details Card -->
        <div class="ad-container" style="margin: 0 auto 1.5rem auto; box-shadow: none; border-color: transparent; background: transparent; min-height:120px; contain:layout style;">
            <div class="ad-label">ADVERTISEMENT</div>
            <!-- 101Di3 -->
            <ins class="adsbygoogle"
                 style="display:block;min-height:100px;"
                 data-ad-client="ca-pub-2738438146721203"
                 data-ad-slot="5733461990"
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
        </div>

        <div class="game-hero">
            <img src="${thumbSrc}" alt="${game.title} - Play Free Online" class="hero-thumb" onerror="this.onerror=null; this.src='${placeholder}';">
        </div>
        
        <h2 class="game-title">${game.title}</h2>
        
        <div class="stats">
            <span>👤 ${activeUsers} Active Players</span>
            <span>⭐ 4.8 Rating</span>
            <span>🏷️ ${game.category.toUpperCase()}</span>
        </div>

        <div style="margin: 2rem 0;">
            <a href="javascript:void(0)" id="play-btn-main" onclick="handlePlayClick('${game.id}')" class="play-btn-large">
                ${getCoins() >= 10 ? 'Play Now (-10 🪙)' : 'Watch Ad for Coins (+10 🪙)'}
            </a>
        </div>

        <!-- AD 3: Middle of Details Card -->
        <div class="ad-container" style="margin: 1.5rem auto; box-shadow: none; border-color: transparent; background: transparent; min-height:120px; contain:layout style;">
            <div class="ad-label">ADVERTISEMENT</div>
            <!-- 101Di3 -->
            <ins class="adsbygoogle"
                 style="display:block;min-height:100px;"
                 data-ad-client="ca-pub-2738438146721203"
                 data-ad-slot="5733461990"
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
        </div>

        <div class="description-box">
            <div class="description-section">
                <h3>About ${game.title}</h3>
                <p>${game.longDescription}</p>
            </div>
            
            <div class="description-section" style="margin-top: 2rem; border-top: 1px solid var(--gold-border); padding-top: 2rem;">
                <h3>How to Play</h3>
                <p>${game.howToPlay}</p>
            </div>
        </div>
    `;
    
    // Initialize injected ads — use requestAnimationFrame for reliable DOM readiness
    requestAnimationFrame(() => {
        const adSlots = detailsContent.querySelectorAll('ins.adsbygoogle');
        adSlots.forEach(slot => {
            if (!slot.dataset.adsbygoogleStatus) {
                try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch(e) {}
            }
        });
    });
    
    // Update Page Title & SEO Meta Tags
    const fullTitle = `Play ${game.title} Online - Free Games | VHCTA Games`;
    document.title = fullTitle;
    
    // SEO Meta Tags update
    const metaDesc = document.getElementById('meta-desc');
    if (metaDesc) metaDesc.setAttribute('content', game.longDescription.substring(0, 160));
    
    const ogTitle = document.getElementById('og-title');
    if (ogTitle) ogTitle.setAttribute('content', fullTitle);
    
    const ogDesc = document.getElementById('og-desc');
    if (ogDesc) ogDesc.setAttribute('content', game.longDescription.substring(0, 160));
    
    const ogImage = document.getElementById('og-image');
    if (ogImage) ogImage.setAttribute('content', `https://vhcta.com/${game.thumbnail || 'assets/icon-512.png'}`);

    const canonical = document.getElementById('canonical-url');
    const prettyUrl = `https://vhcta.com/games/${game.slug || game.id}`;
    if (canonical) canonical.setAttribute('href', prettyUrl);

    // SEO Strategy: Inject JSON-LD for individual Game SEO ranking
    const schemaData = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": game.title,
        "url": prettyUrl,
        "description": game.longDescription,
        "applicationCategory": "GameApplication",
        "operatingSystem": "Web, iOS, Android",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": activeUsers.replace(/,/g, '')
        }
    };
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schemaData);
    document.head.appendChild(script);
});
