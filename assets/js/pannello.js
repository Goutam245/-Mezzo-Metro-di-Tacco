/* =========================================================================
   Pannello di Mezzo Metro di Tacco
   Modifica i contenuti del sito e li salva sul deposito del server.
   Se il deposito non risponde, i contenuti si possono comunque scaricare.
   ========================================================================= */
(function () {
  "use strict";

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var dati = {};
  try { dati = JSON.parse(($("#seme") || {}).textContent || "{}"); } catch (e) {}
  var sporco = false;
  var inModifica = null;      // il prodotto aperto nella finestra
  var bozza = null;           // copia su cui si lavora nella finestra

  /* ── avvisi ──────────────────────────────────────────────────────────── */
  var avviso = $("#avviso"), attesaAvviso;
  function dì(testo, male) {
    avviso.textContent = testo;
    avviso.hidden = false;
    avviso.classList.toggle("p-avviso--male", !!male);
    clearTimeout(attesaAvviso);
    attesaAvviso = setTimeout(function () { avviso.hidden = true; }, male ? 6000 : 2600);
  }
  function segnaSporco() {
    sporco = true;
    $("#stato-salvataggio").textContent = "Ci sono modifiche da salvare";
    $("#stato-salvataggio").classList.add("p-stato--sporco");
  }
  function segnaPulito(testo) {
    sporco = false;
    $("#stato-salvataggio").textContent = testo || "Tutto salvato";
    $("#stato-salvataggio").classList.remove("p-stato--sporco");
  }
  window.addEventListener("beforeunload", function (e) {
    if (sporco) { e.preventDefault(); e.returnValue = ""; }
  });

  /* ── accesso ─────────────────────────────────────────────────────────── */
  function mostraPannello() {
    $("#accesso").hidden = true;
    $("#pannello").hidden = false;
    $("#salva").hidden = false;
    $("#esci").hidden = false;
    caricaDalDeposito().then(function () {
      riempiTutto();
      segnaPulito("Aggiornato il " + (dati.aggiornato || "—"));
    });
  }

  fetch("/api/stato").then(function (r) { return r.json(); }).then(function (s) {
    if (!s.configurato) {
      $("#avviso-configurazione").hidden = false;
      $("#avviso-configurazione").textContent =
        "Attenzione: sul server mancano PANNELLO_CHIAVE e PANNELLO_SEGRETO. " +
        "Finché non ci sono, il pannello non fa entrare nessuno.";
    }
    if (s.dentro) mostraPannello();
  }).catch(function () {
    $("#avviso-configurazione").hidden = false;
    $("#avviso-configurazione").textContent =
      "Il server non risponde. Se stai guardando il sito in locale, il pannello si prova solo online.";
  });

  $("#modulo-accesso").addEventListener("submit", function (e) {
    e.preventDefault();
    var err = $("#errore-accesso");
    err.hidden = true;
    fetch("/api/accesso", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chiave: $("#chiave").value }),
    }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (r) {
        if (!r.ok) { err.textContent = r.d.errore || "Non si entra."; err.hidden = false; return; }
        $("#chiave").value = "";
        mostraPannello();
      }).catch(function () {
        err.textContent = "Il server non risponde.";
        err.hidden = false;
      });
  });

  $("#esci").addEventListener("click", function () {
    if (sporco && !confirm("Ci sono modifiche non salvate. Esci lo stesso?")) return;
    fetch("/api/uscita", { method: "POST" }).then(function () { location.reload(); });
  });

  /* ── deposito ────────────────────────────────────────────────────────── */
  function caricaDalDeposito() {
    return fetch("/api/contenuti", { headers: { accept: "application/json" } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d && d.prodotti) dati = d; })
      .catch(function () {});
  }

  $("#salva").addEventListener("click", function () {
    var b = $("#salva");
    b.disabled = true;
    b.textContent = "Salvo…";
    fetch("/api/contenuti", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(dati),
    }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (r) {
        b.disabled = false;
        b.textContent = "Salva";
        if (!r.ok) { dì(r.d.errore || "Non è stato salvato.", true); return; }
        dati.versione = r.d.versione;
        dati.aggiornato = r.d.aggiornato;
        segnaPulito("Salvato — il sito è aggiornato");
        dì("Fatto: il sito è aggiornato.");
      }).catch(function () {
        b.disabled = false;
        b.textContent = "Salva";
        dì("Il server non risponde. Prova ancora fra poco.", true);
      });
  });

  /* ── schede ──────────────────────────────────────────────────────────── */
  $$(".p-scheda").forEach(function (t) {
    t.addEventListener("click", function () {
      $$(".p-scheda").forEach(function (x) { x.setAttribute("aria-selected", String(x === t)); });
      $$(".p-pagina").forEach(function (p) { p.hidden = p.id !== t.dataset.vai; });
    });
  });

  /* ── testi e impostazioni ────────────────────────────────────────────── */
  var CAMPI_TESTO = ["titoloHero", "titoloChiusuraStoria", "storiaApertura", "whatsapp",
                     "whatsappVisibile", "email", "indirizzo", "mappaUrl"];
  var CAMPI_MESSAGGIO = ["generico", "avvisami", "prodotto", "prodottoSenzaTaglia", "misura"];

  function riempiTesti() {
    var i = dati.impostazioni || (dati.impostazioni = {});
    CAMPI_TESTO.forEach(function (c) {
      var n = $("#t-" + c);
      if (n) { n.value = i[c] || ""; n.oninput = function () { i[c] = n.value; segnaSporco(); contaTitolo(); }; }
    });
    var faq = $("#t-faqSpedizioni");
    faq.checked = i.faqSpedizioni !== false;
    faq.onchange = function () { i.faqSpedizioni = faq.checked; segnaSporco(); };

    var m = dati.messaggi || (dati.messaggi = {});
    CAMPI_MESSAGGIO.forEach(function (c) {
      var n = $("#m-" + c);
      if (n) { n.value = m[c] || ""; n.oninput = function () { m[c] = n.value; segnaSporco(); }; }
    });
    contaTitolo();
  }
  function contaTitolo() {
    var v = ($("#t-titoloHero").value || "").length;
    $("#conta-titolo").textContent = v + " caratteri" + (v > 65 ? " — sopra il limite di 65" : "");
    $("#conta-titolo").style.color = v > 65 ? "#8E0B45" : "";
  }
  $("#usa-titolo-dopo").addEventListener("click", function () {
    $("#t-titoloHero").value = "Scarpe e abbigliamento a Lido degli Scacchi, Comacchio";
    dati.impostazioni.titoloHero = $("#t-titoloHero").value;
    segnaSporco(); contaTitolo();
  });
  $("#usa-chiusura-dopo").addEventListener("click", function () {
    $("#t-titoloChiusuraStoria").value = "Ti aspettiamo in negozio";
    dati.impostazioni.titoloChiusuraStoria = $("#t-titoloChiusuraStoria").value;
    segnaSporco();
  });

  function riempiInaugurazione() {
    var g = dati.inaugurazione || (dati.inaugurazione = {});
    var att = $("#inaug-attiva");
    att.checked = g.attiva !== false;
    att.onchange = function () { g.attiva = att.checked; segnaSporco(); };
    ["titolo", "riga1", "riga2", "pulsante"].forEach(function (c) {
      var n = $("#inaug-" + c);
      n.value = g[c] || "";
      n.oninput = function () { g[c] = n.value; segnaSporco(); };
    });
  }

  /* ── categorie ───────────────────────────────────────────────────────── */
  function quanti(idCat) {
    return (dati.prodotti || []).filter(function (p) { return p.categoria === idCat; }).length;
  }
  function riempiCategorie() {
    var box = $("#elenco-categorie");
    box.innerHTML = "";
    (dati.categorie || []).forEach(function (c, i) {
      var n = quanti(c.id);
      var riga = document.createElement("div");
      riga.className = "p-riga-cat";
      riga.innerHTML =
        '<input type="text" value="" aria-label="Nome della categoria">' +
        '<label class="p-spunta"><input type="checkbox"> Accesa</label>' +
        '<span class="p-voce__sotto">' + n + "</span>" +
        '<button class="p-mini p-mini--pericolo" type="button">Elimina</button>';
      var nome = $("input[type=text]", riga);
      nome.value = c.nome;
      nome.oninput = function () { c.nome = nome.value; segnaSporco(); riempiFiltroCategorie(); };
      var acc = $("input[type=checkbox]", riga);
      acc.checked = c.attiva !== false;
      acc.onchange = function () { c.attiva = acc.checked; segnaSporco(); riempiProdotti(); };
      $(".p-mini", riga).onclick = function () {
        if (n > 0) { dì("Prima sposta o elimina i " + n + " prodotti di questa categoria.", true); return; }
        if (!confirm("Elimino la categoria «" + c.nome + "»?")) return;
        dati.categorie.splice(i, 1);
        segnaSporco(); riempiCategorie(); riempiFiltroCategorie();
      };
      box.appendChild(riga);
    });
  }
  $("#nuova-categoria").addEventListener("click", function () {
    var nome = prompt("Come si chiama la categoria nuova?");
    if (!nome) return;
    var id = sigla(nome);
    if ((dati.categorie || []).some(function (c) { return c.id === id; })) {
      dì("C'è già una categoria che si chiama così.", true); return;
    }
    dati.categorie.push({ id: id, nome: nome.trim(), attiva: true });
    segnaSporco(); riempiCategorie(); riempiFiltroCategorie();
  });
  function sigla(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32) || "categoria";
  }

  function riempiFiltroCategorie() {
    var f = $("#filtro-categoria");
    var scelto = f.value;
    f.innerHTML = '<option value="">Tutte le categorie</option>' +
      (dati.categorie || []).map(function (c) {
        return '<option value="' + c.id + '">' + testo(c.nome) + "</option>";
      }).join("");
    f.value = scelto;
    var s = $("#f-categoria");
    s.innerHTML = (dati.categorie || []).map(function (c) {
      return '<option value="' + c.id + '">' + testo(c.nome) + "</option>";
    }).join("");
  }

  /* ── elenco prodotti ─────────────────────────────────────────────────── */
  function riempiProdotti() {
    var box = $("#elenco-prodotti");
    var q = ($("#cerca").value || "").toLowerCase().trim();
    var cat = $("#filtro-categoria").value;
    var soloSpenti = $("#solo-spenti").checked;
    var nomiCat = {};
    (dati.categorie || []).forEach(function (c) { nomiCat[c.id] = c; });

    var lista = (dati.prodotti || []).filter(function (p) {
      if (cat && p.categoria !== cat) return false;
      if (soloSpenti && p.attivo) return false;
      if (!q) return true;
      return (p.nome + " " + p.id + " " + (p.riferimento || "")).toLowerCase().indexOf(q) >= 0;
    });

    $("#conteggio").textContent =
      lista.length + " di " + (dati.prodotti || []).length + " · sul sito ne compaiono " +
      (dati.prodotti || []).filter(function (p) {
        var c = nomiCat[p.categoria];
        return p.attivo && c && c.attiva !== false;
      }).length;

    box.innerHTML = "";
    lista.forEach(function (p) {
      var c = nomiCat[p.categoria];
      var vivo = p.attivo && c && c.attiva !== false;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "p-voce" + (vivo ? "" : " p-voce--spenta");
      b.innerHTML =
        '<span class="p-pallino' + (vivo ? "" : " p-pallino--spento") + '"></span>' +
        (p.img ? '<img src="' + p.img + '" alt="">' : '<img alt="" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==">') +
        '<span class="p-voce__testo"><span class="p-voce__nome">' + testo(p.nome) + "</span>" +
        '<span class="p-voce__sotto">' + testo(c ? c.nome : p.categoria) +
        (p.riferimento ? " · " + testo(p.riferimento) : "") + "</span></span>";
      b.onclick = function () { apriProdotto(p); };
      box.appendChild(b);
    });
    if (!lista.length) {
      box.innerHTML = '<p class="p-aiuto">Nessun prodotto con questi filtri.</p>';
    }
  }
  ["cerca", "filtro-categoria", "solo-spenti"].forEach(function (id) {
    $("#" + id).addEventListener("input", riempiProdotti);
    $("#" + id).addEventListener("change", riempiProdotti);
  });

  /* ── finestra del prodotto ───────────────────────────────────────────── */
  var finestra = $("#finestra");

  function apriProdotto(p) {
    inModifica = p;
    bozza = JSON.parse(JSON.stringify(p));
    $("#finestra-titolo").textContent = p.nome || "Prodotto nuovo";
    $("#f-nome").value = bozza.nome || "";
    $("#f-id").value = bozza.id || "";
    $("#f-categoria").value = bozza.categoria || ($("#f-categoria").options[0] || {}).value;
    $("#f-descrizione").value = bozza.descrizione || "";
    $("#f-alt").value = bozza.alt || "";
    $("#f-misure").value = (bozza.misure || []).join(", ");
    $("#f-altri").value = (bozza.altriColori || []).join(", ");
    $("#f-riferimento").value = bozza.riferimento || "";
    $("#f-attivo").checked = !!bozza.attivo;
    $("#f-elimina").hidden = !(dati.prodotti || []).includes(p);
    $("#f-errore").hidden = true;
    disegnaVarianti();
    finestra.showModal();
  }

  function disegnaVarianti() {
    var box = $("#f-varianti");
    box.innerHTML = "";
    (bozza.varianti || []).forEach(function (v, i) {
      var d = document.createElement("div");
      d.className = "p-variante";
      d.innerHTML =
        '<img src="' + v.img + '" alt="">' +
        (i === 0 ? '<span class="p-variante__primo">principale</span>' : "") +
        '<button class="p-variante__togli" type="button" aria-label="Togli questa foto">&times;</button>' +
        '<input type="text" value="" aria-label="Nome del colore">';
      $("input", d).value = v.colore || "";
      $("input", d).oninput = function () { v.colore = this.value; };
      $(".p-variante__togli", d).onclick = function () {
        bozza.varianti.splice(i, 1);
        disegnaVarianti();
      };
      $("img", d).onclick = function () {
        if (i === 0) return;
        bozza.varianti.unshift(bozza.varianti.splice(i, 1)[0]);
        disegnaVarianti();
      };
      $("img", d).style.cursor = i === 0 ? "default" : "pointer";
      $("img", d).title = i === 0 ? "" : "Tocca per metterla come principale";
      box.appendChild(d);
    });
    if (!(bozza.varianti || []).length) {
      box.innerHTML = '<p class="p-aiuto" style="margin:0">Nessuna foto: il prodotto sul sito resta senza immagine.</p>';
    }
  }

  $("#f-file").addEventListener("change", function () {
    var files = Array.prototype.slice.call(this.files || []);
    this.value = "";
    var abito = $("#f-categoria").value === "abiti";
    Promise.all(files.map(function (f) { return rimpicciolisci(f, abito ? [780, 1040] : [860, 860]); }))
      .then(function (uri) {
        bozza.varianti = (bozza.varianti || []).concat(uri.map(function (u) {
          return { colore: "", img: u };
        }));
        disegnaVarianti();
        dì(files.length + (files.length === 1 ? " foto aggiunta" : " foto aggiunte"));
      })
      .catch(function () { dì("Una delle foto non si è aperta.", true); });
  });

  function rimpicciolisci(file, misura) {
    return new Promise(function (risolvi, rifiuta) {
      var lettore = new FileReader();
      lettore.onerror = rifiuta;
      lettore.onload = function () {
        var im = new Image();
        im.onerror = rifiuta;
        im.onload = function () {
          var L = misura[0], A = misura[1];
          var tela = document.createElement("canvas");
          tela.width = L; tela.height = A;
          var c = tela.getContext("2d");
          c.fillStyle = "#ffffff";
          c.fillRect(0, 0, L, A);
          var s = Math.min(L / im.width, A / im.height);
          var w = im.width * s, h = im.height * s;
          c.drawImage(im, (L - w) / 2, (A - h) / 2, w, h);
          risolvi(tela.toDataURL("image/webp", 0.84));
        };
        im.src = lettore.result;
      };
      lettore.readAsDataURL(file);
    });
  }

  $("#f-conferma").addEventListener("click", function (e) {
    e.preventDefault();
    var err = $("#f-errore");
    err.hidden = true;
    bozza.nome = $("#f-nome").value.trim();
    bozza.id = $("#f-id").value.trim() || sigla(bozza.nome).toUpperCase();
    bozza.categoria = $("#f-categoria").value;
    bozza.descrizione = $("#f-descrizione").value.trim();
    bozza.alt = $("#f-alt").value.trim();
    bozza.misure = lista($("#f-misure").value);
    bozza.altriColori = lista($("#f-altri").value);
    bozza.riferimento = $("#f-riferimento").value.trim();
    bozza.attivo = $("#f-attivo").checked;
    bozza.img = (bozza.varianti && bozza.varianti[0]) ? bozza.varianti[0].img : (bozza.img || "");

    if (!bozza.nome) { err.textContent = "Il nome del modello serve."; err.hidden = false; return; }
    if (!bozza.categoria) { err.textContent = "Scegli una categoria."; err.hidden = false; return; }
    if (bozza.attivo && !bozza.img) {
      err.textContent = "Per mostrarlo sul sito ci vuole almeno una foto."; err.hidden = false; return;
    }
    var doppio = (dati.prodotti || []).some(function (p) { return p !== inModifica && p.id === bozza.id; });
    if (doppio) { err.textContent = "C'è già un prodotto con questo codice."; err.hidden = false; return; }

    var posto = (dati.prodotti || []).indexOf(inModifica);
    if (posto >= 0) dati.prodotti[posto] = bozza;
    else dati.prodotti.unshift(bozza);

    segnaSporco();
    riempiProdotti();
    riempiCategorie();
    finestra.close();
    dì("Messo a posto. Ricordati di salvare.");
  });

  $("#f-elimina").addEventListener("click", function (e) {
    e.preventDefault();
    if (!confirm("Elimino «" + (inModifica.nome || "") + "»? Non si torna indietro.")) return;
    var posto = dati.prodotti.indexOf(inModifica);
    if (posto >= 0) dati.prodotti.splice(posto, 1);
    segnaSporco();
    riempiProdotti();
    riempiCategorie();
    finestra.close();
    dì("Eliminato. Ricordati di salvare.");
  });

  $("#nuovo-prodotto").addEventListener("click", function () {
    var prima = (dati.categorie || []).filter(function (c) { return c.attiva !== false; })[0];
    apriProdotto({
      id: "", nome: "", descrizione: "", categoria: prima ? prima.id : "",
      alt: "", img: "", varianti: [], altriColori: [],
      misure: ["35", "36", "37", "38", "39", "40", "41"], attivo: true, riferimento: "",
    });
  });

  function lista(s) {
    return String(s || "").split(",").map(function (x) { return x.trim(); })
      .filter(function (x) { return x.length; });
  }
  function testo(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function riempiTutto() {
    riempiFiltroCategorie();
    riempiTesti();
    riempiInaugurazione();
    riempiCategorie();
    riempiProdotti();
  }
})();
