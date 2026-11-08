// Tweetaligheid (Nederlands / Engels)
// - Elke tekst staat er twee keer in: <span class="nl">…</span><span class="en">…</span>
//   De CSS toont alleen de taal die in <html lang="…"> staat.
// - Volgorde van keuze: ?lang=en in de link → eerder gekozen taal → taal van de browser.
// - Knoppen: <button class="taal-knop" data-taal="nl">NL</button>
// - Titel, beschrijving, alt-teksten en aria-labels: data-nl / data-en, data-alt-nl / data-alt-en, data-aria-nl / data-aria-en
(function () {
    var talen = ['nl', 'en'];

    function lees() {
        try { return localStorage.getItem('taal'); } catch (e) { return null; }
    }

    function bewaar(taal) {
        try { localStorage.setItem('taal', taal); } catch (e) { /* geen opslag beschikbaar */ }
    }

    var param = new URLSearchParams(location.search).get('lang');
    var opgeslagen = lees();
    var browser = (navigator.language || 'nl').toLowerCase().indexOf('nl') === 0 ? 'nl' : 'en';
    var taal = talen.indexOf(param) >= 0 ? param : (talen.indexOf(opgeslagen) >= 0 ? opgeslagen : browser);

    // Meteen instellen (nog voor de pagina getekend wordt), zodat je geen twee talen ziet flitsen
    document.documentElement.lang = taal;

    function pasToe() {
        document.documentElement.lang = taal;

        var titel = document.querySelector('title');
        if (titel && titel.getAttribute('data-' + taal)) document.title = titel.getAttribute('data-' + taal);

        var meta = document.querySelector('meta[name="description"]');
        if (meta && meta.getAttribute('data-' + taal)) meta.setAttribute('content', meta.getAttribute('data-' + taal));

        document.querySelectorAll('[data-alt-' + taal + ']').forEach(function (el) {
            el.setAttribute('alt', el.getAttribute('data-alt-' + taal));
        });
        document.querySelectorAll('[data-aria-' + taal + ']').forEach(function (el) {
            el.setAttribute('aria-label', el.getAttribute('data-aria-' + taal));
        });
        document.querySelectorAll('.taal-knop').forEach(function (knop) {
            knop.setAttribute('aria-pressed', knop.getAttribute('data-taal') === taal ? 'true' : 'false');
        });
    }

    document.addEventListener('DOMContentLoaded', pasToe);

    document.addEventListener('click', function (e) {
        var knop = e.target.closest && e.target.closest('.taal-knop');
        if (!knop) return;
        taal = knop.getAttribute('data-taal');
        bewaar(taal);
        pasToe();
    });
})();
