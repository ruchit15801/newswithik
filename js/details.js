// --- COIN SYSTEM ---
// getCoins() and setCoins() are provided by /js/coins.js (loaded before this file)
// CoinSystem.add(n), CoinSystem.spend(n), CoinSystem.get() also available

// ── H5 Ad SDK Ready State ──────────────────────────────────────────────────
// adConfig's onReady fires when SDK is initialized. We track this so reward
// ad calls don't happen before the SDK is ready (which causes silent failures).
var _adSdkReady = false;
var _pendingAdCall = null;

// Override adConfig to capture onReady
(function() {
    var _originalAdConfig = window.adConfig;
    window.adConfig = function(opts) {
        var userOnReady = opts.onReady;
        opts.onReady = function() {
            _adSdkReady = true;
            if (typeof userOnReady === 'function') userOnReady();
            // Fire any queued ad call
            if (typeof _pendingAdCall === 'function') {
                var fn = _pendingAdCall;
                _pendingAdCall = null;
                fn();
            }
        };
        if (typeof _originalAdConfig === 'function') _originalAdConfig(opts);
    };
})();

// Safe adBreak wrapper — queues the call if SDK not ready yet
function safeAdBreak(opts) {
    function doBreak() {
        if (typeof window.adBreak === 'function') {
            window.adBreak(opts);
        } else if (typeof opts.adBreakDone === 'function') {
            opts.adBreakDone({ breakStatus: 'noAdPreloaded' });
        }
    }
    if (_adSdkReady) {
        doBreak();
    } else {
        _pendingAdCall = doBreak;
        // Ultimate fallback: if SDK never fires onReady within 4s, proceed anyway
        setTimeout(function() {
            if (!_adSdkReady) {
                _adSdkReady = true;
                if (typeof _pendingAdCall === 'function') {
                    var fn = _pendingAdCall;
                    _pendingAdCall = null;
                    fn();
                }
            }
        }, 4000);
    }
}

// Global function for handling "Play Now" click with Rewarded Ad & Coins
window.handlePlayClick = function(gameId) {
    var coins = getCoins();
    var btn = document.getElementById('play-btn-main');

    var isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    var playUrl = isLocal ? '/play.html?id=' + gameId : '/play?id=' + gameId;

    // Enough coins → deduct and play directly
    if (coins >= 10) {
        setCoins(coins - 10);
        window.location.href = playUrl;
        return;
    }

    // Not enough coins → show Rewarded Ad to earn coins
    if (btn) btn.textContent = 'Loading Ad...';

    var adViewed = false;

    // Hard fallback: SDK fails entirely → just let user play
    var hardFallback = setTimeout(function() {
        window.location.href = playUrl;
    }, 8000);

    safeAdBreak({
        type: 'reward',
        name: 'earn_coins_reward',
        beforeReward: function(showAdFn) {
            clearTimeout(hardFallback);
            if (btn) btn.textContent = 'Watch Ad...';
            showAdFn();
        },
        adDismissed: function() {
            // User skipped — reset button, keep them on page
            if (btn) btn.innerHTML = 'Watch Ad for Coins (+10 🪙)';
        },
        adViewed: function() {
            // Full ad watched → award exactly +10 coins
            adViewed = true;
            CoinSystem.add(10);
        },
        adBreakDone: function() {
            clearTimeout(hardFallback);
            if (adViewed) {
                // Spend 10 to play (user just earned 10, net = 0)
                CoinSystem.spend(10);
                if (btn) btn.textContent = 'Loading Game...';
                window.location.href = playUrl;
            } else {
                // Ad skipped — stay on page, don't deduct
                if (btn) btn.innerHTML = 'Watch Ad for Coins (+10 🪙)';
            }
        }
    });
};

document.addEventListener('DOMContentLoaded', () => {
    // coins.js already synced the header balance on load — nothing to do here

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
    
    // Initialize injected ads — use a slight delay for reliable DOM readiness and execution order
    setTimeout(() => {
        const adSlots = detailsContent.querySelectorAll('ins.adsbygoogle');
        adSlots.forEach(slot => {
            if (!slot.hasAttribute('data-adsbygoogle-status')) {
                try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch(e) {}
            }
        });
    }, 300);
    
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
