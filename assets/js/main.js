/* =========================================================================
   Mezzo Metro di Tacco — comportamento del sito
   Nessuna libreria esterna, nessuna chiamata a terzi.
   I contenuti arrivano dal seme incorporato e, se c'è, dal pannello.
   ========================================================================= */
(function () {
  "use strict";

  // Si dichiara subito che il JS gira: il CSS nasconde i blocchi .rivela solo
  // con questa classe. Se qualcosa esplode piu' avanti, il sito resta leggibile.
  document.documentElement.classList.add("con-js");

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var fermo = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── contenuti ───────────────────────────────────────────────────────── */
  var seme = {};
  try { seme = JSON.parse(($("#seme") || {}).textContent || "{}"); } catch (e) {}
  var dati = seme;

  function testoWa(modello) {
    var m = dati.messaggi || {};
    return "https://wa.me/" + (dati.impostazioni || {}).whatsapp +
           "?text=" + encodeURIComponent(modello);
  }
  function link(chiave) {
    return testoWa(((dati.messaggi || {})[chiave]) || "Ciao! Vi scrivo dal sito.");
  }
  function categorieAttive() {
    return (dati.categorie || []).filter(function (c) { return c.attiva; });
  }
  function prodottiAttivi() {
    var vive = {};
    categorieAttive().forEach(function (c) { vive[c.id] = 1; });
    return (dati.prodotti || []).filter(function (p) { return p.attivo && vive[p.categoria]; });
  }
  function nomeCategoria(id) {
    var c = (dati.categorie || []).filter(function (x) { return x.id === id; })[0];
    return c ? c.nome : id;
  }

  /* ── scheda prodotto ─────────────────────────────────────────────────── */
  var ICONA_WA =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.8 14.16c-.24.68-1.42 1.31-1.96 1.36-.5.05-1.14.07-1.83-.11-.42-.11-.96-.31-1.66-.6-2.92-1.21-4.83-4.05-4.98-4.24-.14-.19-1.18-1.51-1.18-2.88 0-1.37.74-2.05 1-2.33.26-.28.57-.35.76-.35.19 0 .38 0 .55.01.18.01.41-.06.64.47.24.55.81 1.92.88 2.06.07.14.12.3.02.49-.09.19-.14.3-.28.47-.14.16-.29.36-.42.49-.14.14-.28.29-.12.57.16.28.72 1.16 1.54 1.88 1.06.93 1.95 1.22 2.23 1.36.28.14.44.12.6-.07.17-.19.7-.8.88-1.08.19-.28.37-.23.62-.14.25.09 1.6.75 1.87.89.28.14.46.21.53.32.07.12.07.66-.17 1.34Z"/></svg>';

  function schedaHTML(p, prefisso) {
    var abito = p.categoria === "abiti";
    var idMis = "mis-" + (prefisso || "cat") + "-" + p.id;
    var h = [];
    h.push('<article class="scheda' + (abito ? " scheda--abito" : "") +
           '" data-categoria="' + attr(p.categoria) + '" data-nome="' + attr(p.nome) + '">');
    // Le foto «ambientate» (su modella, o scattate in negozio) riempiono il
    // riquadro invece di stare dentro con l'aria intorno: cosi' il loro fondo
    // colorato non stampa un rettangolo dentro la scheda bianca.
    h.push('<div class="scheda__foto' + (p.pieno ? " scheda__foto--pieno" : "") + '">');
    h.push('<img src="' + attr(p.img) + '" alt="' + attr(p.alt || p.nome) +
           '" loading="lazy" decoding="async" width="' + (abito ? 780 : 860) +
           '" height="' + (abito ? 1040 : 860) + '">');
    h.push('<span class="scheda__etichetta">' + esc(nomeCategoria(p.categoria)) + "</span>");
    h.push("</div>");
    h.push('<div class="scheda__corpo">');
    h.push('<h3 class="scheda__nome">' + esc(p.nome) + "</h3>");
    if (p.descrizione) h.push('<p class="scheda__descrizione">' + esc(p.descrizione) + "</p>");

    if (p.varianti && p.varianti.length > 1) {
      h.push('<div class="colori" role="group" aria-label="Colori disponibili">');
      p.varianti.forEach(function (v, i) {
        h.push('<button type="button" class="colore" data-img="' + attr(v.img) +
               '" style="background-image:url(&quot;' + attr(v.img) + '&quot;)" aria-pressed="' +
               (i === 0 ? "true" : "false") + '"><span class="solo-lettori">' +
               esc(v.colore) + "</span></button>");
      });
      h.push("</div>");
    }

    h.push('<div class="misure">');
    if (p.misure && p.misure.length) {
      h.push('<span class="misure__etichetta" id="' + attr(idMis) + '">Scegli la misura</span>');
      // stato vuoto del selettore, come da copy-microtesti §3
      h.push('<span class="solo-lettori">Numero</span>');
      h.push('<div class="misure__riga" role="group" aria-labelledby="' + attr(idMis) + '">');
      p.misure.forEach(function (m) {
        h.push('<button type="button" class="misura" aria-pressed="false">' + esc(m) + "</button>");
      });
      h.push("</div>");
    } else {
      h.push('<p class="misure__nota">Chiedi la tua misura in chat</p>');
    }
    // copy-microtesti §3, ultima riga: lo stato «non piu disponibile»
    if (p.esaurito) {
      h.push('<p class="scheda__esaurito">Questo modello è finito. ' +
             'Scrivici: guardiamo se torna.</p>');
    }
    h.push("</div>");

    h.push('<div class="scheda__azione">');
    h.push('<a class="bottone bottone--primario" href="' + attr(messaggioProdotto(p.nome, "")) +
           '" target="_blank" rel="noopener">' + ICONA_WA + "Richiedi prodotto</a>");
    h.push('<p class="scheda__postilla">Ti rispondiamo su WhatsApp.</p>');
    h.push("</div></div></article>");
    return h.join("");
  }

  function messaggioProdotto(nome, taglia) {
    var m = dati.messaggi || {};
    var t = taglia
      ? (m.prodotto || "Ciao! Vorrei informazioni su «{NOME MODELLO}», numero {TAGLIA}. È disponibile?")
      : (m.prodottoSenzaTaglia || "Ciao! Vorrei informazioni su «{NOME MODELLO}». È disponibile?");
    t = t.replace("{NOME MODELLO}", nome).replace("{TAGLIA}", taglia);
    return testoWa(t);
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function attr(s) { return esc(s).replace(/"/g, "&quot;"); }

  /* ── catalogo: disegno, filtro FLIP, interazioni ─────────────────────── */
  var griglia = $("#griglia");
  var vuoto   = $("#nessun-risultato");
  var filtro  = $("#filtro");
  var ancora  = $("#ancora");
  var categoriaViva = "tutto";
  var A_BLOCCHI = 16;          // quante schede per volta, poi «Vedi altri modelli»
  var mostrate = A_BLOCCHI;

  function disegnaCatalogo() {
    if (!griglia) return;
    var lista = prodottiAttivi();
    griglia.innerHTML = lista.map(function (p) { return schedaHTML(p, "cat"); }).join("");
    if (filtro) {
      var voci = ['<button type="button" class="filtro__voce" data-cat="tutto" aria-pressed="true">Tutto</button>'];
      categorieAttive().forEach(function (c) {
        if (!lista.some(function (p) { return p.categoria === c.id; })) return;
        voci.push('<button type="button" class="filtro__voce" data-cat="' + attr(c.id) +
                  '" aria-pressed="false">' + esc(c.nome) + "</button>");
      });
      $(".filtro__lista", filtro).innerHTML = voci.join("");
    }
    applicaFiltro(categoriaViva, true);
  }

  function daMostrare(cat, limite) {
    var mappa = new Map();
    var quanti = 0;
    $$(".scheda", griglia).forEach(function (c) {
      if (cat !== "tutto" && c.dataset.categoria !== cat) { mappa.set(c, false); return; }
      quanti++;
      mappa.set(c, quanti <= limite);
    });
    return { mappa: mappa, quanti: quanti };
  }

  function applicaFiltro(cat, subito) {
    categoriaViva = cat;
    var nastro = $(".filtro__lista", filtro);
    $$(".filtro__voce", filtro).forEach(function (b) {
      var acceso = b.dataset.cat === cat;
      b.setAttribute("aria-pressed", String(acceso));
      // se il filtro acceso sta fuori dal nastro, lo si porta in mezzo.
      // si sposta soltanto il nastro, mai la pagina: scrollIntoView, anche con
      // block:"nearest", trascinava giu' l'apertura di una settantina di pixel
      // appena il sito si apriva.
      if (acceso && nastro && nastro.scrollWidth > nastro.clientWidth) {
        var meta = b.offsetLeft - (nastro.clientWidth - b.offsetWidth) / 2;
        var max = nastro.scrollWidth - nastro.clientWidth;
        meta = Math.max(0, Math.min(meta, max));
        if (nastro.scrollTo) {
          nastro.scrollTo({ left: meta, behavior: fermo ? "auto" : "smooth" });
        } else {
          nastro.scrollLeft = meta;
        }
      }
    });
    var carte = $$(".scheda", griglia);
    var esito = daMostrare(cat, mostrate);
    var resta = function (c) { return esito.mappa.get(c) === true; };
    if (ancora) ancora.hidden = esito.quanti <= mostrate;

    if (subito || fermo) {
      carte.forEach(function (c) { c.hidden = !resta(c); c.style.cssText = ""; });
      if (vuoto) vuoto.hidden = esito.quanti > 0;
      return;
    }

    var uscenti = carte.filter(function (c) { return !c.hidden && !resta(c); });
    var prima = new Map();
    carte.forEach(function (c) { if (!c.hidden) prima.set(c, c.getBoundingClientRect()); });

    // primo tempo: chi esce si spegne
    uscenti.forEach(function (c) {
      c.style.transition = "opacity .13s linear, transform .13s ease-in";
      c.style.opacity = "0";
      c.style.transform = "scale(.96)";
    });

    setTimeout(function () {
      carte.forEach(function (c) { c.hidden = !resta(c); });
      if (vuoto) vuoto.hidden = esito.quanti > 0;

      // FLIP: chi resta si sposta, chi entra compare
      var muovi = [];
      carte.filter(function (c) { return !c.hidden; }).forEach(function (c) {
        var dopo = c.getBoundingClientRect();
        var p = prima.get(c);
        c.style.transition = "none";
        if (p) {
          var dx = p.left - dopo.left, dy = p.top - dopo.top;
          c.style.opacity = "";
          c.style.transform = (dx || dy) ? "translate(" + dx + "px," + dy + "px)" : "";
        } else {
          c.style.opacity = "0";
          c.style.transform = "scale(.97) translateY(10px)";
        }
        muovi.push(c);
      });
      void griglia.offsetWidth;                       // un solo reflow forzato
      muovi.forEach(function (c) {
        c.style.transition = "transform .46s cubic-bezier(.22,.61,.36,1), opacity .34s ease-out";
        c.style.transform = "";
        c.style.opacity = "";
      });
      setTimeout(function () {
        muovi.forEach(function (c) { c.style.cssText = ""; });
        uscenti.forEach(function (c) { c.style.cssText = ""; });
      }, 500);
    }, 140);
  }

  if (filtro) {
    filtro.addEventListener("click", function (e) {
      var b = e.target.closest(".filtro__voce");
      if (b && b.dataset.cat !== categoriaViva) {
        mostrate = A_BLOCCHI;                       // cambiando categoria si riparte dall'inizio
        applicaFiltro(b.dataset.cat);
      }
    });
  }

  var altri = $("#vedi-altri");
  if (altri) {
    altri.addEventListener("click", function () {
      var primoNuovo = mostrate;
      mostrate += A_BLOCCHI;
      applicaFiltro(categoriaViva, true);
      var nuove = $$(".scheda", griglia).filter(function (c) { return !c.hidden; }).slice(primoNuovo);
      if (!fermo) {
        nuove.forEach(function (c, i) {
          c.style.transition = "none";
          c.style.opacity = "0";
          c.style.transform = "translateY(12px)";
          setTimeout(function () {
            c.style.transition = "opacity .4s ease-out, transform .4s cubic-bezier(.22,.61,.36,1)";
            c.style.opacity = ""; c.style.transform = "";
            setTimeout(function () { c.style.cssText = ""; }, 450);
          }, 20 + i * 26);
        });
      }
      // il fuoco va sul pulsante della prima scheda nuova, non sul primo
      // pallino colore che capita
      if (nuove[0]) {
        var bersaglio = nuove[0].querySelector(".scheda__azione a");
        if (bersaglio) bersaglio.focus({ preventScroll: true });
      }
    });
  }

  /* La sezione «Abbigliamento donna» mostra gli abiti con la stessa scheda del
     catalogo: stessa foto, stesso selettore, stesso pulsante «Richiedi prodotto». */
  var grigliaAbiti = $("#griglia-abiti");
  function disegnaAbiti() {
    if (!grigliaAbiti) return;
    // Solo un assaggio: l'elenco completo sta nel catalogo, e cosi il link
    // «Vedi gli abiti nel catalogo» ha davvero qualcosa in piu da mostrare.
    var abiti = prodottiAttivi().filter(function (p) { return p.categoria === "abiti"; }).slice(0, 4);
    grigliaAbiti.innerHTML = abiti.map(function (p) { return schedaHTML(p, "abiti"); }).join("");
    grigliaAbiti.hidden = abiti.length === 0;
  }

  function agganciaSchede(contenitore) {
    if (!contenitore) return;
    contenitore.addEventListener("click", function (e) {
      var colore = e.target.closest(".colore");
      if (colore) {
        var scheda = colore.closest(".scheda");
        $$(".colore", scheda).forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
        colore.setAttribute("aria-pressed", "true");
        $("img", scheda).src = colore.dataset.img;
        return;
      }
      var mis = e.target.closest(".misura");
      if (mis) {
        var s = mis.closest(".scheda");
        var gia = mis.getAttribute("aria-pressed") === "true";
        $$(".misura", s).forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
        if (!gia) mis.setAttribute("aria-pressed", "true");
        var scelta = gia ? "" : mis.textContent.trim();
        $(".scheda__azione a", s).href = messaggioProdotto(s.dataset.nome, scelta);
      }
    });
  }
  agganciaSchede(griglia);
  agganciaSchede(grigliaAbiti);

  /* ── «le scarpe»: il nastro che scorre e non si ferma mai ────────────── */
  function riempiVetrina() {
    var v = $("#vetrina");
    if (!v) return;
    // Gli scatti di studio (AA, AB, AC, BE, BF, BV) sono su bianco pieno e
    // reggono l'ingrandimento; la serie NPM e' piu' morbida e va in coda.
    // Senza questo ordinamento il nastro mostrava dieci NPM di fila.
    var scelti = prodottiAttivi().filter(function (p) {
      return p.categoria !== "abiti" && !p.pieno &&
             /^(NPM|AA|AB|AC|BE|BF|BV|CC|CE|BB|BC)/.test(p.id);
    });
    scelti = scelti.filter(function (p) { return !/^NPM/.test(p.id); })
             .concat(scelti.filter(function (p) { return /^NPM/.test(p.id); }))
             .slice(0, 12);
    if (!scelti.length) { v.innerHTML = ""; return; }
    // Ogni voce e un collegamento vero a WhatsApp, col messaggio precompilato
    // della scheda prodotto senza taglia (copy-microtesti §2). La seconda
    // copia del nastro serve solo al giro continuo: e nascosta ai lettori di
    // schermo e fuori dal percorso di tabulazione.
    function voce(p, doppia) {
      return '<li class="nastro__voce"' + (doppia ? ' aria-hidden="true"' : "") +
             '><a href="' + attr(messaggioProdotto(p.nome, "")) + '"' +
             (doppia ? ' tabindex="-1"' : "") +
             ' target="_blank" rel="noopener">' +
             '<img src="' + attr(p.img) + '" alt="' + (doppia ? "" : attr(p.alt)) +
             '" loading="lazy" decoding="async" width="860" height="860"><span>' +
             esc(p.nome) + "</span></a></li>";
    }
    // la seconda copia serve al giro continuo: l'animazione scorre di metà pista
    v.innerHTML = scelti.map(function (p) { return voce(p, false); }).join("") +
                  scelti.map(function (p) { return voce(p, true); }).join("");
  }

  /* ── la cascata delle schede ─────────────────────────────────────────── */
  /* Nota: senza la classe «entra» la scheda è già visibile. L'animazione è
     un di più: se l'osservatore non parte, il catalogo si vede lo stesso. */
  function cascata(contenitore) {
    if (!contenitore || fermo || !("IntersectionObserver" in window)) return;
    var carte = $$(".scheda", contenitore).filter(function (c) { return !c.hidden; });
    var os = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) {
        if (!v.isIntersecting) return;
        var c = v.target;
        c.classList.add("entra");
        // finita l'animazione la classe se ne va: se restasse, il FLIP del
        // filtro e il sollevamento al passaggio del mouse non funzionerebbero
        c.addEventListener("animationend", function fine() {
          c.classList.remove("entra");
          c.removeEventListener("animationend", fine);
        });
        os.unobserve(c);
      });
    }, { rootMargin: "0px 0px -5% 0px", threshold: 0.04 });
    carte.forEach(function (c, i) {
      c.style.setProperty("--i", i % 8);
      os.observe(c);
    });
  }



  /* ── le pedane della vetrina ──────────────────────────────────────────────
     Quattro modelli fermi al loro posto. A turno, uno per volta, la pedana
     gira su sé stessa: a metà giro si vede la faccia di dietro, dove nel
     frattempo abbiamo messo il modello successivo. Finito il giro la faccia
     nuova diventa quella davanti e la pedana torna dritta, senza che si veda.
     Si ferma quando l'apertura non è in vista o la scheda è in secondo piano. */

  /* ── testi che vivono nel pannello ───────────────────────────────────── */
  function applicaContenuti() {
    var i = dati.impostazioni || {};
    $$("[data-testo]").forEach(function (n) {
      var v = i[n.dataset.testo];
      if (v) n.textContent = v;
    });
    $$("[data-wa]").forEach(function (a) { a.href = link(a.dataset.wa); });
    $$("[data-recapito]").forEach(function (n) {
      var v = i[n.dataset.recapito];
      if (!v) return;
      n.textContent = v;
      if (n.tagName === "A" && n.dataset.recapito === "email") n.href = "mailto:" + v;
    });
    $$("[data-mappa]").forEach(function (a) { if (i.mappaUrl) a.href = i.mappaUrl; });

    var inaug = dati.inaugurazione || {};
    var sez = $("#inaugurazione");
    if (sez) {
      sez.hidden = !inaug.attiva;
      if (inaug.attiva) {
        if (inaug.titolo) $("[data-inaug='titolo']", sez).textContent = inaug.titolo;
        if (inaug.riga1)  $("[data-inaug='riga1']", sez).textContent  = inaug.riga1;
        if (inaug.riga2)  $("[data-inaug='riga2']", sez).textContent  = inaug.riga2;
        if (inaug.pulsante) $("[data-inaug='pulsante']", sez).lastChild.nodeValue = inaug.pulsante;
      }
      var voce = $('.righello__salti a[href="#inaugurazione"]');
      if (voce) voce.hidden = !inaug.attiva;
    }

    var spedizioni = $("#faq-spedizioni");
    if (spedizioni) spedizioni.hidden = i.faqSpedizioni === false;
  }

  /* ── stecca del righello ─────────────────────────────────────────────── */
  var rail = $("#righello");
  var salti = $("#righello-salti");
  var cifra = $("#righello-cifra");
  var sezioni = [];

  function costruisciRighello() {
    if (!rail) return;
    var t = $(".righello__tacche", rail);
    var h = [];
    for (var c = 0; c <= 50; c++) {
      var lungo = c % 5 === 0;
      h.push('<i style="top:' + (c / 50 * 100) + '%;width:' + (lungo ? 18 : 9) + 'px"></i>');
    }
    t.innerHTML = h.join("");
    misuraSezioni();
  }

  function misuraSezioni() {
    if (!salti) return;
    sezioni = $$("main > section[id]").filter(function (s) { return !s.hidden; });
    var doc = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    salti.innerHTML = sezioni.map(function (s) {
      var q = Math.min(1, (s.offsetTop - 80) / doc);
      var t = s.dataset.titolo || (s.querySelector("h1,h2") || {}).textContent || "";
      return '<a href="#' + s.id + '" style="top:' + (q * 100).toFixed(2) + '%">' +
             '<span>' + esc(t.trim()) + "</span></a>";
    }).join("");
  }

  /* ── un solo gestore di scorrimento ──────────────────────────────────── */
  var testata = $(".testata");
  var barra = $(".barra-telefono");
  var mobile = $("#misura-mobile");
  var inCoda = false;

  function suScroll() {
    var y = window.scrollY || 0;
    var doc = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var q = Math.min(1, Math.max(0, y / doc));

    if (testata) testata.classList.toggle("staccata", y > 8);
    var pct = (q * 100).toFixed(2) + "%";
    if (rail) rail.style.setProperty("--avanzamento", pct);
    if (mobile) mobile.style.setProperty("--avanzamento", pct);
    if (cifra) cifra.textContent = Math.round(q * 50) + " cm";
    if (barra) barra.classList.toggle("visibile", y > 420);

    if (salti) {
      var viva = null;
      for (var k = 0; k < sezioni.length; k++) {
        if (sezioni[k].offsetTop - 120 <= y) viva = sezioni[k].id;
      }
      $$("a", salti).forEach(function (a) {
        a.setAttribute("aria-current", String(a.getAttribute("href") === "#" + viva));
      });
    }
    inCoda = false;
  }
  function chiediScroll() {
    if (!inCoda) { inCoda = true; requestAnimationFrame(suScroll); }
  }
  window.addEventListener("scroll", chiediScroll, { passive: true });

  var attesaMisura;
  window.addEventListener("resize", function () {
    clearTimeout(attesaMisura);
    attesaMisura = setTimeout(function () { misuraSezioni(); suScroll(); }, 180);
  }, { passive: true });

  /* ── comparsa allo scorrimento ───────────────────────────────────────── */
  function attivaRivela() {
    // ogni «scaglione» numera i suoi figli: il ritardo lo calcola il CSS
    $$(".scaglione").forEach(function (g) {
      Array.prototype.forEach.call(g.children, function (n, i) {
        n.style.setProperty("--r", i);
      });
    });
    var da = $$(".rivela");
    if (fermo || !("IntersectionObserver" in window)) {
      da.forEach(function (n) { n.classList.add("dentro"); });
      return;
    }
    var os = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) {
        if (v.isIntersecting) { v.target.classList.add("dentro"); os.unobserve(v.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    da.forEach(function (n) { os.observe(n); });

    // Rete di sicurezza. In una scheda in secondo piano, in un'anteprima o in una
    // pagina precaricata l'osservatore non parte finché non si guarda la pagina:
    // senza questo controllo la prima schermata resterebbe bianca.
    // A pagina visibile l'osservatore ha già fatto tutto e questo non tocca niente.
    function recupera() {
      var alto = window.innerHeight * 1.05;
      da.forEach(function (n) {
        if (n.classList.contains("dentro")) return;
        if (n.getBoundingClientRect().top < alto) { n.classList.add("dentro"); os.unobserve(n); }
      });
    }
    setTimeout(recupera, 700);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) setTimeout(recupera, 60);
    });

    // Secondo paracadute: in certi contesti (anteprime, schede in secondo
    // piano, pagine precaricate) l'IntersectionObserver non parte MAI. Senza
    // questo, la pagina resterebbe bianca. Costa un rAF per scorrimento e si
    // stacca da solo appena tutti i blocchi sono comparsi.
    function alloScorrimento() {
      recupera();
      for (var i = 0; i < da.length; i++) {
        if (!da[i].classList.contains("dentro")) return;
      }
      window.removeEventListener("scroll", alloScorrimento);
      window.removeEventListener("resize", alloScorrimento);
    }
    window.addEventListener("scroll", alloScorrimento, { passive: true });
    window.addEventListener("resize", alloScorrimento, { passive: true });
  }

  /* ── menu da telefono ────────────────────────────────────────────────── */
  var nav = $("#navigazione");
  var apri = $("#menu-apri");
  var chiudi = $("#menu-chiudi");
  function menu(stato) {
    if (!nav) return;
    nav.classList.toggle("aperta", stato);
    if (apri) apri.setAttribute("aria-expanded", String(stato));
    document.documentElement.style.overflow = stato ? "hidden" : "";
    if (stato) { var p = $("a", nav); if (p) p.focus(); }
  }
  if (apri) apri.addEventListener("click", function () { menu(true); });
  if (chiudi) chiudi.addEventListener("click", function () { menu(false); });
  if (nav) nav.addEventListener("click", function (e) { if (e.target.closest("a")) menu(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav && nav.classList.contains("aperta")) { menu(false); apri.focus(); }
  });

  /* ── fisarmonica delle domande ───────────────────────────────────────── */
  $$(".fisarmonica__testa").forEach(function (t) {
    t.addEventListener("click", function () {
      var corpo = document.getElementById(t.getAttribute("aria-controls"));
      var aperto = t.getAttribute("aria-expanded") === "true";
      t.setAttribute("aria-expanded", String(!aperto));
      if (fermo) { corpo.style.height = aperto ? "0px" : "auto"; return; }
      if (aperto) {
        corpo.style.height = corpo.scrollHeight + "px";
        requestAnimationFrame(function () { corpo.style.height = "0px"; });
      } else {
        corpo.style.height = corpo.scrollHeight + "px";
        corpo.addEventListener("transitionend", function fine() {
          corpo.style.height = "auto";
          corpo.removeEventListener("transitionend", fine);
        });
      }
    });
  });

  /* ── banner cookie ───────────────────────────────────────────────────── */
  // Si cerca la striscia per classe, non per id: su privacy.html esiste un
  // blocco di testo con id="cookie" (l'ancora dell'informativa) e agganciarlo
  // qui cancellava il capitolo o mandava in errore tutto l'avvio della pagina.
  var cookie = $(".cookie-bar");
  function altezzaCookie() {
    document.documentElement.style.setProperty(
      "--barra-cookie", cookie && cookie.isConnected ? cookie.offsetHeight + "px" : "0px");
  }
  if (cookie) {
    var visto = false;
    try { visto = localStorage.getItem("mmt-cookie") === "1"; } catch (e) {}
    if (visto) { cookie.remove(); altezzaCookie(); }
    else {
      cookie.hidden = false;
      altezzaCookie();
      window.addEventListener("resize", altezzaCookie, { passive: true });
      var chiudiCookie = $(".cookie-bar__x", cookie);
      if (chiudiCookie) chiudiCookie.addEventListener("click", function () {
        cookie.remove();
        altezzaCookie();
        try { localStorage.setItem("mmt-cookie", "1"); } catch (e) {}
      });
    }
  }

  /* ── dalla sezione abiti si entra nel catalogo già filtrato ──────────── */
  var vaiAbiti = $("#vai-abiti");
  if (vaiAbiti) {
    vaiAbiti.addEventListener("click", function () {
      var b = $('.filtro__voce[data-cat="abiti"]');
      if (b) { mostrate = A_BLOCCHI; applicaFiltro("abiti", true); }
    });
  }

  /* ── l'anno nel piede si scrive da solo ──────────────────────────────── */
  $$("#anno").forEach(function (n) { n.textContent = new Date().getFullYear(); });

  /* ── contenuti dal vivo, se il pannello è collegato ──────────────────── */
  function aggiornaDalPannello() {
    if (!window.fetch) return;
    fetch("/api/contenuti", { headers: { accept: "application/json" } })
      .then(function (r) { return r.ok && r.status !== 204 ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.prodotti || d.versione === dati.versione) return;
        dati = d;
        applicaContenuti();
        spezzaTitolo();
        disegnaCatalogo();
        disegnaAbiti();
        riempiVetrina();
        cascata(griglia);
        cascata(grigliaAbiti);
              misuraSezioni();
        suScroll();
      })
      .catch(function () { /* il sito funziona anche da solo */ });
  }


  /* ── il titolo su due righe ──────────────────────────────────────────
     Riga 1 romana, riga 2 corsiva: e' il gesto che rende «vero» il sito di
     riferimento. Il testo NON si riscrive — si spezza sulla virgola la
     stessa identica stringa che arriva dal pannello, cosi' il cancello dei
     testi continua a passare. */
  function spezzaTitolo() {
    var h = $(".eroe h1");
    if (!h) return;
    var testo = (h.textContent || "").trim();
    var taglio = testo.indexOf(", ");
    if (taglio === -1) return;
    // lo spazio resta attaccato alla prima riga: il cancello dei testi legge
    // «Scacchi, dal» e non «Scacchi,dal»
    h.textContent = testo.slice(0, taglio + 2);
    var coda = document.createElement("span");
    coda.className = "corsivo";
    coda.textContent = testo.slice(taglio + 2);
    h.appendChild(coda);
  }


  /* ── il video dell apertura ──────────────────────────────────────────
     Tre cose sole, tutte difensive:
       · con «meno movimento» il video non parte e resta il poster;
       · se il browser rifiuta la riproduzione automatica (succede su
         iOS a batteria bassa, o con il risparmio energetico) si torna al
         poster invece di lasciare un rettangolo nero;
       · quando l apertura esce dallo schermo il video si mette in pausa:
         non ha senso far girare un decoder per una cosa che non si vede. */
  function avviaVideoApertura() {
    var v = $("#video-apertura");
    if (!v) return;

    function spegni() {                 // «meno movimento»: mai in moto
      try { v.pause(); } catch (e) {}
      v.removeAttribute("autoplay");
      v.style.display = "none";         // resta il poster, messo in CSS
    }
    if (fermo) { spegni(); return; }

    // Se il browser rifiuta la riproduzione automatica NON si nasconde il
    // video: l attributo poster tiene comunque un fotogramma sullo schermo,
    // e al primo gesto dell utente si riprova. Nasconderlo per sempre
    // significherebbe che chi ha il risparmio energetico acceso non vede
    // mai il video, nemmeno dopo aver toccato la pagina.
    var giaRiprovato = false;
    function prova() {
      var p = v.play();
      if (p && typeof p.catch === "function") p.catch(function () {});
    }
    function riprova() {
      if (giaRiprovato) return;
      giaRiprovato = true;
      prova();
      ["pointerdown", "touchstart", "keydown", "scroll"].forEach(function (e) {
        window.removeEventListener(e, riprova);
      });
    }
    var p = v.play();
    if (p && typeof p.catch === "function") {
      p.catch(function () {
        ["pointerdown", "touchstart", "keydown", "scroll"].forEach(function (e) {
          window.addEventListener(e, riprova, { once: true, passive: true });
        });
      });
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (voci) {
        voci.forEach(function (x) {
          if (v.style.display === "none") return;
          if (x.isIntersecting) { var q = v.play(); if (q && q.catch) q.catch(function () {}); }
          else { try { v.pause(); } catch (e) {} }
        });
      }, { threshold: 0.01 }).observe(v);
    }
  }

  /* ── parallasse dell apertura ────────────────────────────────────────
     Il JS scrive SOLO due variabili, --tx e --ty. La trasformazione di base
     resta nel CSS e non viene mai sovrascritta: e la lezione della versione
     precedente, dove scrivere node.style.transform cancellava rotazioni e
     centrature ogni volta che il dito si muoveva.

     Ogni strato porta la sua profondita in --p: 1 = in primo piano, valori
     bassi = sullo sfondo. Da qui vengono sia la parallasse col puntatore
     (solo desktop con mouse vero) sia lo scorrimento cinematografico, che
     fa uscire gli strati a velocita diverse. */
  function agganciaParallasse() {
    var eroe = document.querySelector(".eroe");
    if (!eroe || fermo) return;
    var strati = Array.prototype.slice.call(
      eroe.querySelectorAll(".eroe__pezzo, .eroe__neon"));
    if (!strati.length) return;

    var mx = 0, my = 0, sy = 0, inCoda = false, inVista = true;
    var conMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    function disegna() {
      inCoda = false;
      for (var i = 0; i < strati.length; i++) {
        var n = strati[i];
        var p = parseFloat(getComputedStyle(n).getPropertyValue("--p")) || 0.5;
        var x = mx * 26 * p;
        var y = my * 18 * p + sy * 44 * p;
        n.style.setProperty("--tx", x.toFixed(2) + "px");
        n.style.setProperty("--ty", y.toFixed(2) + "px");
      }
    }
    function chiedi() {
      if (!inCoda && inVista) { inCoda = true; requestAnimationFrame(disegna); }
    }

    if (conMouse) {
      eroe.addEventListener("pointermove", function (e) {
        var r = eroe.getBoundingClientRect();
        mx = (e.clientX - r.left) / r.width - 0.5;
        my = (e.clientY - r.top) / r.height - 0.5;
        chiedi();
      }, { passive: true });
      eroe.addEventListener("pointerleave", function () {
        mx = my = 0; chiedi();
      }, { passive: true });
    }

    // scorrimento: gli strati escono a velocita diverse, e il piano di
    // sfondo resta indietro rispetto ai prodotti
    window.addEventListener("scroll", function () {
      var r = eroe.getBoundingClientRect();
      inVista = r.bottom > 0 && r.top < window.innerHeight;
      if (!inVista) return;
      sy = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height)));
      chiedi();
    }, { passive: true });
  }

  /* ── rete di sicurezza dell apertura ─────────────────────────────────
     Le animazioni di entrata usano fill-mode «backwards»: finche non
     partono, l elemento resta allo stato iniziale, cioe invisibile. In una
     scheda in secondo piano, in un anteprima, o con il compositore
     rallentato, possono non partire affatto — e l apertura resterebbe
     vuota. Dopo 2,6s le si porta comunque alla fine. Le animazioni infinite
     (aloni, pulviscolo, respiro) si lasciano stare: finish() su una
     animazione infinita solleva un errore. */
  function garantisciApertura() {
    var eroe = $(".eroe");
    if (!eroe || !eroe.getAnimations) return;
    // subtree:true prende anche gli pseudo-elementi: senza, il tratto sotto
    // la riga in corsivo (::after) resterebbe a scaleX(0), cioe invisibile.
    var viste;
    try { viste = eroe.getAnimations({ subtree: true }); }
    catch (e) { viste = eroe.getAnimations(); }
    // Gli pseudo-elementi non si raggiungono in modo affidabile da qui: per
    // quelli si usa una classe, e il CSS annulla l animazione lasciando lo
    // stato finale gia dichiarato.
    eroe.classList.add("eroe--pronta");
    viste.forEach(function (a) {
      try {
        var t = a.effect && a.effect.getTiming();
        if (!t || t.iterations === Infinity) return;
        if (a.playState !== "finished") a.finish();
      } catch (e) { /* un animazione in meno non deve fermare il resto */ }
    });
  }
  setTimeout(garantisciApertura, 2900);
  window.addEventListener("load", function () { setTimeout(garantisciApertura, 400); });
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) setTimeout(garantisciApertura, 300);
  });

  /* ── avvio ───────────────────────────────────────────────────────────── */
  applicaContenuti();
  spezzaTitolo();
  disegnaCatalogo();
  disegnaAbiti();
  riempiVetrina();
  cascata(griglia);
  cascata(grigliaAbiti);
  costruisciRighello();
  avviaVideoApertura();
  agganciaParallasse();
  attivaRivela();
  suScroll();
  setTimeout(misuraSezioni, 350);
  window.addEventListener("load", function () { misuraSezioni(); suScroll(); });
  aggiornaDalPannello();
})();
