// Presentatiemodus
// P          aan/uit (de menubalk verdwijnt, elke slide wordt één scherm)
// Page Down / → / spatie  (= "volgende" op een presenter)  naar de volgende slide
// Page Up / ←             (= "vorige" op een presenter)    terug
// T          timer tonen/verbergen
// R          timer opnieuw op 0 zetten
// Is een slide langer dan het scherm, dan scrolt die eerst stap voor stap verder.
// Elementen met class "stap" verschijnen één voor één bij "volgende", voor er naar
// de volgende slide gesprongen wordt (zoals animaties in PowerPoint).
// Conceptweergave: op je eigen computer (Live Server, localhost of een geopend bestand) worden
// de onafgewerkte delen (hidden + data-concept) getoond. Op de live site blijven ze verborgen.
(function () {
    var lokaal = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
    if (!lokaal) return;
    var delen = document.querySelectorAll('[data-concept]');
    if (!delen.length) return;
    delen.forEach(function (el) { el.hidden = false; });
    var balk = document.createElement('div');
    balk.className = 'concept-balk';
    balk.textContent = 'Conceptweergave: ' + delen.length + ' verborgen delen zichtbaar (alleen op je eigen computer, niet live)';
    document.body.appendChild(balk);
})();

// Bij vernieuwen (F5) altijd bovenaan beginnen, ook als er #iets in de adresbalk staat.
// Een gewone link met #anker (bv. vanaf de cv-pagina) blijft wel werken.
(function () {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    var nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    if (nav && nav.type === 'reload') {
        if (location.hash) history.replaceState(null, '', location.pathname + location.search);
        window.scrollTo(0, 0);
        window.addEventListener('load', function () { window.scrollTo(0, 0); });
    } else if (location.hash) {
        // Link met #anker: na het laden meteen naar dat onderdeel springen
        window.addEventListener('load', function () {
            var doel = document.getElementById(decodeURIComponent(location.hash.slice(1)));
            if (doel) doel.scrollIntoView({ behavior: 'instant' });
        });
    }
})();

(function () {
    var actief = false;
    var timerZichtbaar = true;
    var start = null;
    var laatsteDoel = null;
    var laatsteTijd = 0;

    var label = document.createElement('div');
    label.className = 'presentatie-label';
    document.body.appendChild(label);

    // Voortgangsbalk, teller en timer onderaan
    var hud = document.createElement('div');
    hud.className = 'presentatie-hud';
    hud.innerHTML = '<div class="hud-balk"></div><div class="hud-info"></div>';
    document.body.appendChild(hud);
    var balk = hud.querySelector('.hud-balk');
    var info = hud.querySelector('.hud-info');

    // Alle zichtbare slides (slides met het attribuut "hidden" worden overgeslagen)
    function slides() {
        return Array.prototype.slice.call(document.querySelectorAll('.slide:not([hidden])'));
    }

    function navHoogte() {
        return actief ? 0 : 80;
    }

    function topVan(el) {
        return Math.max(0, Math.round(el.getBoundingClientRect().top + window.scrollY - navHoogte()));
    }

    // Alle "stops", in volgorde en zonder dubbels.
    // Hoofdpagina: elke .slide. Andere pagina's (cv): de grote onderdelen en titels.
    function stops() {
        var lijst;
        if (slides().length) {
            lijst = slides().map(topVan);
        } else {
            lijst = [];
            document.querySelectorAll('.hero, .cv-header, .section, .cv-heading').forEach(function (el) {
                lijst.push(el.matches('.hero, .cv-header') ? 0 : topVan(el));
            });
        }
        lijst.sort(function (a, b) { return a - b; });
        // Stops die vlak na elkaar liggen samenvoegen
        return lijst.filter(function (y, i) { return i === 0 || y - lijst[i - 1] > 150; });
    }

    // Huidige positie: tijdens het vloeiend scrollen telt het doel, niet de tussenpositie
    function positie() {
        return (laatsteDoel !== null && Date.now() - laatsteTijd < 1000) ? laatsteDoel : window.scrollY;
    }

    // De slide waarvan de bovenkant op of net boven y ligt
    function slideOp(y) {
        var gevonden = null;
        slides().forEach(function (el) { if (topVan(el) <= y + 10) gevonden = el; });
        return gevonden;
    }

    function scrollNaar(y) {
        laatsteDoel = y;
        laatsteTijd = Date.now();
        window.scrollTo({ top: y, behavior: 'smooth' });
    }

    function ga(richting) {
        var nu = positie();
        var stap = window.innerHeight * 0.8;
        var lijst = stops();
        var huidig = slideOp(nu);
        var doel;

        if (richting > 0) {
            // Eerst de verborgen stappen van deze slide tonen
            var volgende = huidig && huidig.querySelector('.stap:not(.getoond)');
            if (volgende) {
                volgende.classList.add('getoond');
                return;
            }
            doel = lijst.find(function (y) { return y > nu + 10; });
            if (doel === undefined || doel - nu > window.innerHeight) {
                doel = nu + stap;
            } else {
                // Nieuwe slide: begin met alle stappen verborgen
                var nieuw = slideOp(doel);
                if (nieuw) nieuw.querySelectorAll('.stap').forEach(function (s) { s.classList.remove('getoond'); });
            }
        } else {
            // Terug gaat altijd meteen naar de vorige slide (stappen worden niet één voor één teruggedraaid)
            doel = lijst.slice().reverse().find(function (y) { return y < nu - 10; });
            if (doel === undefined || nu - doel > window.innerHeight) {
                doel = Math.max(0, nu - stap);
            } else {
                // Terug naar de vorige slide: die toont al haar stappen
                var vorige = slideOp(doel);
                if (vorige) vorige.querySelectorAll('.stap').forEach(function (s) { s.classList.add('getoond'); });
            }
        }
        scrollNaar(doel);
    }

    function tijd() {
        if (!start) return '00:00';
        var s = Math.floor((Date.now() - start) / 1000);
        return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    }

    function updateHud() {
        if (!actief) return;
        var lijst = slides();
        var tekst = [];
        if (lijst.length) {
            var y = window.scrollY + 10;
            var huidig = 0;
            lijst.forEach(function (el, i) { if (topVan(el) <= y) huidig = i; });
            balk.style.width = ((huidig + 1) / lijst.length * 100) + '%';
            tekst.push((huidig + 1) + ' / ' + lijst.length);
        }
        if (timerZichtbaar) tekst.push(tijd());
        info.textContent = tekst.join(' · ');
        info.style.display = tekst.length ? '' : 'none';
    }

    function toon(tekst) {
        label.textContent = tekst;
        label.classList.add('zichtbaar');
        clearTimeout(label.timer);
        label.timer = setTimeout(function () { label.classList.remove('zichtbaar'); }, 1500);
    }

    window.addEventListener('scroll', updateHud, { passive: true });
    setInterval(updateHud, 1000);

    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey || e.altKey || e.metaKey) return;
        if (e.target.closest && e.target.closest('input, textarea')) return;
        var k = e.key.toLowerCase();

        if (k === 'p') {
            actief = !actief;
            document.body.classList.toggle('presentatie', actief);
            document.documentElement.style.scrollPaddingTop = actief ? '0' : '';
            if (actief && !start) start = Date.now();
            toon(actief ? 'Presentatiemodus aan' : 'Presentatiemodus uit');
            updateHud();
            return;
        }
        if (!actief) return;

        if (k === 't') {
            timerZichtbaar = !timerZichtbaar;
            updateHud();
        } else if (k === 'r') {
            start = Date.now();
            toon('Timer opnieuw gestart');
            updateHud();
        } else if (e.key === 'PageDown' || e.key === 'ArrowRight' || (e.key === ' ' && !e.shiftKey)) {
            e.preventDefault();
            ga(1);
        } else if (e.key === 'PageUp' || e.key === 'ArrowLeft' || (e.key === ' ' && e.shiftKey)) {
            e.preventDefault();
            ga(-1);
        }
    });
})();
