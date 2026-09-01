/* =========================================================================
   Mezzo Metro di Tacco — comportamento del sito
   Nessuna libreria esterna, nessuna chiamata a terzi.
   I contenuti arrivano dal seme incorporato e, se c'è, dal pannello.
   ========================================================================= */
(function () {
  "use strict";

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
           '" data-categoria="' + p.categoria + '" data-nome="' + attr(p.nome) + '">');
    h.push('<div class="scheda__foto">');
    h.push('<img src="' + p.img + '" alt="' + attr(p.alt || p.nome) +
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
        h.push('<button type="button" class="colore" data-img="' + v.img +
               '" style="background-image:url(' + v.img + ')" aria-pressed="' +
               (i === 0 ? "true" : "false") + '"><span class="solo-lettori">' +
               esc(v.colore) + "</span></button>");
      });
      h.push("</div>");
    } else if (p.varianti && p.varianti.length === 1) {
      h.push('<p class="colori__altri">Colore: ' + esc(p.varianti[0].colore) + "</p>");
    }
    if (p.altriColori && p.altriColori.length) {
      h.push('<p class="colori__altri">Su richiesta anche ' +
             esc(p.altriColori.join(", ").toLowerCase()) + ".</p>");
    }

    h.push('<div class="misure">');
    if (p.misure && p.misure.length) {
      h.push('<span class="misure__etichetta" id="' + attr(idMis) + '">Scegli la misura</span>');
      h.push('<div class="misure__riga" role="group" aria-labelledby="' + attr(idMis) + '">');
      p.misure.forEach(function (m) {
        h.push('<button type="button" class="misura" aria-pressed="false">' + esc(m) + "</button>");
      });
      h.push("</div>");
    } else {
      h.push('<p class="misure__nota">Chiedi la tua misura in chat</p>');
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
    $$(".filtro__voce", filtro).forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.cat === cat));
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
      if (nuove[0]) nuove[0].querySelector("a, button").focus({ preventScroll: true });
    });
  }

  /* La sezione «Abbigliamento donna» mostra gli abiti con la stessa scheda del
     catalogo: stessa foto, stesso selettore, stesso pulsante «Richiedi prodotto». */
  var grigliaAbiti = $("#griglia-abiti");
  function disegnaAbiti() {
    if (!grigliaAbiti) return;
    var abiti = prodottiAttivi().filter(function (p) { return p.categoria === "abiti"; });
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

  /* ── aiuto misura: prepara il messaggio ──────────────────────────────── */
  var aiuto = $("#aiuto-misura");
  if (aiuto) {
    var stato = { numero: "", calzata: "", modello: "" };
    var scelto = $("#aiuto-modello");
    var anteprima = $("#aiuto-anteprima");
    var invio = $("#aiuto-invio");

    function testoAiuto() {
      var m = (dati.messaggi || {}).misura ||
        "Ciao! Vorrei informazioni su «{NOME MODELLO}». Di solito porto il {NUMERO} e mi sta {CALZATA}. Che misura ordino?";
      if (!stato.numero) return "Ciao! Vi scrivo dal sito. Non so che numero prendere: mi aiutate?";
      var calzata = stato.calzata || "giusta";
      if (!stato.modello) {
        // senza modello scelto il testo del pannello non regge: le virgolette
        // resterebbero vuote. Si scrive la stessa cosa in una frase intera.
        return "Ciao! Vi scrivo dal sito. Di solito porto il " + stato.numero +
               " e mi sta " + calzata + ": che misura mi conviene ordinare?";
      }
      return m.replace("{NOME MODELLO}", stato.modello)
              .replace("{NUMERO}", stato.numero)
              .replace("{CALZATA}", calzata);
    }
    function aggiorna() {
      anteprima.textContent = testoAiuto();
      invio.href = testoWa(testoAiuto());
    }
    aiuto.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-campo]");
      if (!b) return;
      var gruppo = b.closest("[data-gruppo]");
      $$("button[data-campo]", gruppo).forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
      b.setAttribute("aria-pressed", "true");
      stato[b.dataset.campo] = b.dataset.valore;
      aggiorna();
    });
    if (scelto) {
      scelto.addEventListener("change", function () { stato.modello = scelto.value; aggiorna(); });
    }
    aggiorna();
  }

  function riempiModelli() {
    var sel = $("#aiuto-modello");
    if (!sel) return;
    var opz = ['<option value="">Non ho ancora scelto</option>'];
    prodottiAttivi().forEach(function (p) {
      if (!p.misure || !p.misure.length) return;
      opz.push('<option value="' + attr(p.nome) + '">' + esc(p.nome) + "</option>");
    });
    sel.innerHTML = opz.join("");
  }

  /* ── vetrina «le scarpe» ─────────────────────────────────────────────── */
  function riempiVetrina() {
    var v = $("#vetrina");
    if (!v) return;
    var scelti = prodottiAttivi().filter(function (p) {
      return p.categoria !== "abiti" && /^(NPM|AA|AB|AC|BE|BF|BV|CC|CE|BB|BC)/.test(p.id);
    }).slice(0, 8);
    v.innerHTML = scelti.map(function (p) {
      return '<li class="vetrina__voce"><img src="' + p.img + '" alt="' + attr(p.alt) +
             '" loading="lazy" decoding="async" width="860" height="860"><span>' +
             esc(p.nome) + "</span></li>";
    }).join("");
  }

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
  var cookie = $("#cookie");
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
      $(".cookie-bar__x", cookie).addEventListener("click", function () {
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

  /* ── contenuti dal vivo, se il pannello è collegato ──────────────────── */
  function aggiornaDalPannello() {
    if (!window.fetch) return;
    fetch("/api/contenuti", { headers: { accept: "application/json" } })
      .then(function (r) { return r.ok && r.status !== 204 ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.prodotti || d.versione === dati.versione) return;
        dati = d;
        applicaContenuti();
        disegnaCatalogo();
        disegnaAbiti();
        riempiVetrina();
        riempiModelli();
        misuraSezioni();
        suScroll();
      })
      .catch(function () { /* il sito funziona anche da solo */ });
  }

  /* ── avvio ───────────────────────────────────────────────────────────── */
  applicaContenuti();
  disegnaCatalogo();
  disegnaAbiti();
  riempiVetrina();
  riempiModelli();
  costruisciRighello();
  attivaRivela();
  suScroll();
  setTimeout(misuraSezioni, 350);
  window.addEventListener("load", function () { misuraSezioni(); suScroll(); });
  aggiornaDalPannello();
})();
