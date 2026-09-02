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
           '" data-categoria="' + attr(p.categoria) + '" data-nome="' + attr(p.nome) + '">');
    h.push('<div class="scheda__foto">');
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

  /* ── «le scarpe»: il nastro che scorre e non si ferma mai ────────────── */
  function riempiVetrina() {
    var v = $("#vetrina");
    if (!v) return;
    var scelti = prodottiAttivi().filter(function (p) {
      return p.categoria !== "abiti" && /^(NPM|AA|AB|AC|BE|BF|BV|CC|CE|BB|BC)/.test(p.id);
    }).slice(0, 10);
    if (!scelti.length) { v.innerHTML = ""; return; }
    function voce(p, doppia) {
      return '<li class="nastro__voce"' + (doppia ? ' aria-hidden="true"' : "") +
             '><img src="' + attr(p.img) + '" alt="' + (doppia ? "" : attr(p.alt)) +
             '" loading="lazy" decoding="async" width="860" height="860"><span>' +
             esc(p.nome) + "</span></li>";
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

  /* ── la parallasse della vetrina ──────────────────────────────────────────
     Ogni pezzo della scena ha la sua profondità in --p: quelli davanti si
     spostano di più, quelli in fondo quasi niente. Si scrive solo --tx/--ty,
     che il CSS compone con la rotazione di base: nessun transform sovrascritto.
     Un solo rAF in coda, e si ferma quando l'apertura esce di vista. */
  function agganciaParallasse() {
    var eroe = $(".eroe");
    var pezzi = $$(".eroe__pezzo");
    if (!eroe || !pezzi.length || fermo) return;

    var mx = 0, my = 0, sy = 0, inCoda = false, inVista = true;
    var puntatore = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    function disegna() {
      inCoda = false;
      for (var i = 0; i < pezzi.length; i++) {
        var n = pezzi[i];
        var p = parseFloat(getComputedStyle(n).getPropertyValue("--p")) || 0.5;
        var x = mx * 30 * p;
        var y = my * 22 * p + sy * 26 * p;
        n.style.setProperty("--tx", x.toFixed(2) + "px");
        n.style.setProperty("--ty", y.toFixed(2) + "px");
      }
    }
    function chiedi() { if (!inCoda && inVista) { inCoda = true; requestAnimationFrame(disegna); } }

    if (puntatore) {
      eroe.addEventListener("pointermove", function (e) {
        var r = eroe.getBoundingClientRect();
        mx = (e.clientX - r.left) / r.width - 0.5;
        my = (e.clientY - r.top) / r.height - 0.5;
        chiedi();
      }, { passive: true });
      eroe.addEventListener("pointerleave", function () { mx = my = 0; chiedi(); }, { passive: true });
    }

    window.addEventListener("scroll", function () {
      var r = eroe.getBoundingClientRect();
      inVista = r.bottom > 0 && r.top < window.innerHeight;
      if (!inVista) return;
      sy = Math.max(-1, Math.min(1, -r.top / Math.max(1, r.height)));
      chiedi();
    }, { passive: true });

    disegna();
  }

  /* ── i cinquanta centimetri che salgono ──────────────────────────────── */
  function agganciaCifra() {
    var n = $("#cifra-cinquanta");
    if (!n) return;
    var arrivo = parseInt(n.textContent, 10) || 50;
    if (fermo || !("IntersectionObserver" in window)) { n.textContent = arrivo; return; }
    var os = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) {
        if (!v.isIntersecting) return;
        os.disconnect();
        var inizio = null;
        (function passo(t) {
          if (inizio === null) inizio = t;
          var q = Math.min(1, (t - inizio) / 1100);
          n.textContent = Math.round(arrivo * (1 - Math.pow(1 - q, 3)));
          if (q < 1) requestAnimationFrame(passo);
        })(performance.now());
      });
    }, { threshold: 0.5 });
    os.observe(n);
  }

  /* ── le pedane della vetrina ──────────────────────────────────────────────
     Quattro modelli fermi al loro posto. A turno, uno per volta, la pedana
     gira su sé stessa: a metà giro si vede la faccia di dietro, dove nel
     frattempo abbiamo messo il modello successivo. Finito il giro la faccia
     nuova diventa quella davanti e la pedana torna dritta, senza che si veda.
     Si ferma quando l'apertura non è in vista o la scheda è in secondo piano. */
  function avviaVetrina() {
    var scaffale = $(".eroe__scaffale");
    if (!scaffale || fermo) return;
    var posti = $$("li", scaffale);
    if (!posti.length) return;

    var magazzino = prodottiAttivi().filter(function (p) {
      return p.categoria !== "abiti" && p.img;
    });
    if (magazzino.length <= posti.length) return;

    var GIRO = 1000;        // deve combaciare con la transizione in CSS
    var PAUSA = 2400;       // quanto sta ferma una pedana prima della prossima
    var posto = 0, pesca = 0, battito = null, inVista = true, giroInCorso = false;

    function inVetrina() {
      return posti.map(function (li) {
        var im = li.querySelector(".scaffale__faccia--davanti img");
        return im ? im.getAttribute("src") : "";
      });
    }
    function prossimoModello() {
      var esposti = inVetrina();
      for (var t = 0; t < magazzino.length; t++) {
        var p = magazzino[(pesca + t) % magazzino.length];
        if (esposti.indexOf(p.img) === -1) {
          pesca = (pesca + t + 1) % magazzino.length;
          return p;
        }
      }
      return null;
    }

    function gira() {
      if (giroInCorso) return;
      var li = posti[posto % posti.length];
      posto++;
      var p = prossimoModello();
      if (!li || !p) return;

      var telaio = li.querySelector(".scaffale__telaio");
      var davanti = li.querySelector(".scaffale__faccia--davanti img");
      var dietro = li.querySelector(".scaffale__faccia--dietro img");
      if (!telaio || !davanti || !dietro) return;

      // si gira solo quando la foto nuova è pronta: mai una pedana vuota
      var pronta = new Image();
      pronta.onload = function () {
        giroInCorso = true;
        dietro.src = p.img;
        dietro.alt = "";
        li.classList.add("gira");
        setTimeout(function () {
          // a giro finito la faccia nuova passa davanti e il telaio torna
          // dritto senza transizione: l'occhio non se ne accorge
          davanti.src = p.img;
          davanti.alt = p.alt || p.nome;
          telaio.style.transition = "none";
          li.classList.remove("gira");
          void telaio.offsetWidth;
          telaio.style.transition = "";
          giroInCorso = false;
        }, GIRO + 40);
      };
      pronta.onerror = function () { posto--; };
      pronta.src = p.img;
    }

    function accendi() { if (!battito && inVista) battito = setInterval(gira, GIRO + PAUSA); }
    function spegni() { if (battito) { clearInterval(battito); battito = null; } }

    // Si parte subito. L'osservatore serve solo a METTERE IN PAUSA quando
    // l'apertura esce di vista: se lo aspettassimo per partire, in una scheda
    // in secondo piano o in un'anteprima le pedane non girerebbero mai.
    accendi();

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) spegni(); else accendi();
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (voci) {
        inVista = voci[0].isIntersecting;
        if (inVista && !document.hidden) accendi(); else spegni();
      }, { threshold: 0.12 }).observe(scaffale);
    }
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
        disegnaCatalogo();
        disegnaAbiti();
        riempiVetrina();
        cascata(griglia);
        cascata(grigliaAbiti);
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
  cascata(griglia);
  cascata(grigliaAbiti);
  agganciaParallasse();
  agganciaCifra();
  avviaVetrina();
  riempiModelli();
  costruisciRighello();
  attivaRivela();
  suScroll();
  setTimeout(misuraSezioni, 350);
  window.addEventListener("load", function () { misuraSezioni(); suScroll(); });
  aggiornaDalPannello();
})();
