// Presentatiemodus
// Druk op P om aan/uit te zetten. Daarna springen Page Down / → / spatie (of "volgende"
// op een presenter) naar het volgende onderdeel, en Page Up / ← (of "vorige") terug.
// Is een onderdeel langer dan het scherm, dan scrolt het eerst stap voor stap verder.
(function () {
    var actief = false;
    var navHoogte = 80;

    var label = document.createElement('div');
    label.className = 'presentatie-label';
    label.textContent = 'Presentatiemodus aan';
    document.body.appendChild(label);

    // Alle "stops": de bovenkant van elk onderdeel, in volgorde, zonder dubbels
    function stops() {
        var lijst = [];
        document.querySelectorAll('.hero, .cv-header, .section, .cv-heading').forEach(function (el) {
            var y = Math.max(0, Math.round(el.getBoundingClientRect().top + window.scrollY - navHoogte));
            if (el.matches('.hero, .cv-header')) y = 0;
            lijst.push(y);
        });
        lijst.sort(function (a, b) { return a - b; });
        // Stops die vlak na elkaar liggen (bv. begin van een sectie en de eerste titel) samenvoegen
        return lijst.filter(function (y, i) { return i === 0 || y - lijst[i - 1] > 150; });
    }

    function ga(richting) {
        var nu = window.scrollY;
        var stap = window.innerHeight * 0.8;
        var lijst = stops();
        var doel;

        if (richting > 0) {
            doel = lijst.find(function (y) { return y > nu + 10; });
            if (doel === undefined || doel - nu > window.innerHeight) doel = nu + stap;
        } else {
            doel = lijst.slice().reverse().find(function (y) { return y < nu - 10; });
            if (doel === undefined || nu - doel > window.innerHeight) doel = Math.max(0, nu - stap);
        }
        window.scrollTo({ top: doel, behavior: 'smooth' });
    }

    function toon(tekst) {
        label.textContent = tekst;
        label.classList.add('zichtbaar');
        clearTimeout(label.timer);
        label.timer = setTimeout(function () { label.classList.remove('zichtbaar'); }, 1500);
    }

    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey || e.altKey || e.metaKey) return;
        if (e.target.closest && e.target.closest('input, textarea')) return;

        if (e.key === 'p' || e.key === 'P') {
            actief = !actief;
            document.body.classList.toggle('presentatie', actief);
            toon(actief ? 'Presentatiemodus aan' : 'Presentatiemodus uit');
            return;
        }
        if (!actief) return;

        if (e.key === 'PageDown' || e.key === 'ArrowRight' || (e.key === ' ' && !e.shiftKey)) {
            e.preventDefault();
            ga(1);
        } else if (e.key === 'PageUp' || e.key === 'ArrowLeft' || (e.key === ' ' && e.shiftKey)) {
            e.preventDefault();
            ga(-1);
        }
    });
})();
