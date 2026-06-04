/**
 * ══════════════════════════════════════════════════════
 *  PLAY NEWS — CENTRALIZED COIN SYSTEM  (coins.js)
 *  Single source of truth — used by ALL pages.
 *
 *  Rules:
 *   • Default: 5 coins (new user)
 *   • Daily login bonus: +2 coins (once per calendar day)
 *   • Watch rewarded ad: +10 coins
 *   • Play a game: -10 coins
 *   • Net cost for playing: 0 (watch ad to earn, spend to play)
 *
 *  localStorage keys:
 *   vhcta_coins      → current balance (number)
 *   vhcta_last_bonus → ISO date string of last daily bonus
 * ══════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    var STORAGE_KEY  = 'vhcta_coins';
    var BONUS_KEY    = 'vhcta_last_bonus';
    var DEFAULT_COINS = 5;

    /* ── Core helpers ────────────────────────────────── */
    function getCoins() {
        var val = parseInt(localStorage.getItem(STORAGE_KEY), 10);
        if (isNaN(val)) {
            // First visit — initialise to default
            localStorage.setItem(STORAGE_KEY, DEFAULT_COINS);
            return DEFAULT_COINS;
        }
        return val;
    }

    function setCoins(amount) {
        var safe = Math.max(0, Math.round(amount)); // never go negative
        localStorage.setItem(STORAGE_KEY, safe);
        _updateUI(safe);
        return safe;
    }

    function addCoins(amount) {
        return setCoins(getCoins() + amount);
    }

    function spendCoins(amount) {
        return setCoins(getCoins() - amount);
    }

    /* ── UI update — works on any page that has #balance-amount ─ */
    function _updateUI(amount) {
        var el = document.getElementById('balance-amount');
        if (!el) return;

        var prev = parseInt(el.textContent, 10) || 0;
        el.textContent = amount;

        // Animate only when balance changes
        if (amount !== prev) {
            var container = document.getElementById('coin-balance-container');
            if (container) {
                container.classList.remove('coin-animate');
                void container.offsetWidth; // reflow
                container.classList.add('coin-animate');

                // Float label (+N or -N)
                var diff = amount - prev;
                if (diff !== 0) {
                    var floatEl = document.createElement('div');
                    floatEl.className = 'coin-float';
                    floatEl.textContent = (diff > 0 ? '+' : '') + diff;
                    container.appendChild(floatEl);
                    setTimeout(function () { floatEl.remove(); }, 1500);
                }
            }
        }
    }

    /* ── Daily login bonus ───────────────────────────── */
    function checkDailyBonus() {
        var today     = new Date().toISOString().slice(0, 10); // "2026-06-04"
        var lastBonus = localStorage.getItem(BONUS_KEY);
        if (lastBonus !== today) {
            localStorage.setItem(BONUS_KEY, today);
            // Delay so UI is rendered first
            setTimeout(function () { addCoins(2); }, 900);
        }
    }

    /* ── Initialise header display ───────────────────── */
    function initDisplay() {
        var el = document.getElementById('balance-amount');
        if (el) {
            el.textContent = getCoins();
        }
    }

    /* ── Run on DOMContentLoaded ─────────────────────── */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            initDisplay();
            checkDailyBonus();
        });
    } else {
        // Already loaded (script placed at bottom)
        initDisplay();
        checkDailyBonus();
    }

    /* ── Expose global API ───────────────────────────── */
    window.CoinSystem = {
        get:   getCoins,
        set:   setCoins,
        add:   addCoins,
        spend: spendCoins,
        refresh: function () { _updateUI(getCoins()); }
    };

    // Legacy shims so existing code in details.js / main.js still works
    window.getCoins = getCoins;
    window.setCoins = setCoins;

})();
