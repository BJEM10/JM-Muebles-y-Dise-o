/* ==========================================================================
   J M Muebles y Diseño CR — main.js
   Classic script (defer), IIFE, no ES modules. Reads window.__BRAND__.
   ========================================================================== */
(function () {
  "use strict";

  var data = window.__BRAND__ || {};
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;

  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "]", e); }
  }

  /* ---------------------------------------------------------------------
     Splash — double safety (CSS keyframe handles the case JS never runs)
     ------------------------------------------------------------------- */
  function initSplash() {
    var splash = $("[data-splash]");
    if (!splash) return;
    var hide = function () { splash.classList.add("is-out"); };
    if (document.readyState === "complete") setTimeout(hide, 500);
    else window.addEventListener("load", function () { setTimeout(hide, 350); });
    setTimeout(hide, 2200); // don't make visitors wait long on a static page
  }

  /* ---------------------------------------------------------------------
     Nav — solid on scroll + mobile burger
     ------------------------------------------------------------------- */
  function initNav() {
    var nav = $("[data-nav]");
    if (!nav) return;
    var onScroll = function () {
      if (window.scrollY > 24) nav.classList.add("is-solid");
      else nav.classList.remove("is-solid");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    var burger = $("[data-nav-burger]");
    var mobile = $("[data-nav-mobile]");
    if (!burger || !mobile) return;
    burger.addEventListener("click", function () {
      var open = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!open));
      mobile.classList.toggle("is-open", !open);
    });
    $$("a", mobile).forEach(function (a) {
      a.addEventListener("click", function () {
        burger.setAttribute("aria-expanded", "false");
        mobile.classList.remove("is-open");
      });
    });
  }

  /* ---------------------------------------------------------------------
     Smooth anchor scroll with nav offset (native scrolling)
     ------------------------------------------------------------------- */
  function initAnchorScroll() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      var navOffset = 192; // matches --nav-h
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - navOffset,
        behavior: reduced ? "auto" : "smooth"
      });
    });
  }

  /* ---------------------------------------------------------------------
     Reveal on scroll — IntersectionObserver, low threshold + safety net
     ------------------------------------------------------------------- */
  function initReveals() {
    var els = $$("[data-reveal]");
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -2% 0px" });
    els.forEach(function (el) { io.observe(el); });

    setTimeout(function () {
      els.forEach(function (el) {
        if (!el.classList.contains("is-visible") && el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add("is-visible");
        }
      });
    }, 6000);
  }

  /* ---------------------------------------------------------------------
     Bento cards — tilt + cursor-follow halo (fine pointers only)
     ------------------------------------------------------------------- */
  function initTilt() {
    if (!fineHover) return;
    var cards = $$("[data-tilt]");
    cards.forEach(function (card) {
      var rect;
      var onMove = function (e) {
        rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width;
        var y = (e.clientY - rect.top) / rect.height;
        card.style.setProperty("--hx", (x * 100) + "%");
        card.style.setProperty("--hy", (y * 100) + "%");
        var rotX = (0.5 - y) * 8;
        var rotY = (x - 0.5) * 10;
        card.style.transform = "perspective(900px) rotateX(" + rotX + "deg) rotateY(" + rotY + "deg) translateY(-4px)";
      };
      var onLeave = function () { card.style.transform = ""; };
      card.addEventListener("mousemove", onMove);
      card.addEventListener("mouseout", function (e) {
        if (!card.contains(e.relatedTarget)) onLeave();
      });
    });
  }

  /* ---------------------------------------------------------------------
     Servicios carousel — native horizontal scroll-snap; arrows/dots/autoplay
     are enrichment only (the cards themselves are plain links, so the
     section works with JS disabled — you just scroll the row by hand).
     ------------------------------------------------------------------- */
  function initCarousel() {
    var track = $("[data-carousel-track]");
    if (!track) return;
    var cards = $$(".bento-card", track);
    if (!cards.length) return;

    var dotsWrap = $("[data-carousel-dots]");
    var prevBtn = $("[data-carousel-prev]");
    var nextBtn = $("[data-carousel-next]");

    if (dotsWrap) {
      dotsWrap.innerHTML = cards.map(function (_, i) {
        return '<button type="button" class="carousel-dot" aria-label="Ir a la tarjeta ' + (i + 1) + '"></button>';
      }).join("");
    }
    var dots = dotsWrap ? $$(".carousel-dot", dotsWrap) : [];

    function currentIndex() {
      var trackLeft = track.getBoundingClientRect().left;
      var best = 0, bestDist = Infinity;
      cards.forEach(function (c, i) {
        var d = Math.abs(c.getBoundingClientRect().left - trackLeft);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      return best;
    }

    function scrollToIndex(i) {
      i = Math.max(0, Math.min(cards.length - 1, i));
      // getBoundingClientRect (not offsetLeft) so the track's own negative
      // margin/padding bleed doesn't throw the math off.
      var delta = cards[i].getBoundingClientRect().left - track.getBoundingClientRect().left;
      track.scrollTo({
        left: track.scrollLeft + delta,
        behavior: reduced ? "auto" : "smooth"
      });
    }

    function updateDots() {
      var idx = currentIndex();
      dots.forEach(function (d, i) { d.classList.toggle("is-active", i === idx); });
    }

    if (prevBtn) prevBtn.addEventListener("click", function () { scrollToIndex(currentIndex() - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { scrollToIndex(currentIndex() + 1); });
    dots.forEach(function (d, i) { d.addEventListener("click", function () { scrollToIndex(i); }); });

    var scrollTimer;
    track.addEventListener("scroll", function () {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(updateDots, 100);
    }, { passive: true });
    updateDots();

    // Gentle autoplay — paused by any manual interaction, off entirely
    // under prefers-reduced-motion (an unattended infinite loop is exactly
    // the kind of motion that setting asks us to skip).
    if (!reduced) {
      var timer = setInterval(function () {
        var idx = currentIndex();
        scrollToIndex(idx + 1 >= cards.length ? 0 : idx + 1);
      }, 4800);
      var stop = function () { clearInterval(timer); };
      track.addEventListener("mouseenter", stop);
      track.addEventListener("touchstart", stop, { passive: true });
      track.addEventListener("wheel", stop, { passive: true });
      if (prevBtn) prevBtn.addEventListener("click", stop);
      if (nextBtn) nextBtn.addEventListener("click", stop);
      dots.forEach(function (d) { d.addEventListener("click", stop); });
    }
  }

  /* ---------------------------------------------------------------------
     Language toggle — ES (hardcoded in HTML) <-> EN (data-en* attributes)
     ------------------------------------------------------------------- */
  var LANG_KEY = "jm-lang";

  function applyLang(lang) {
    document.documentElement.lang = lang;
    document.body.setAttribute("data-lang", lang);

    $$("[data-en]").forEach(function (el) {
      if (!el.dataset.esOriginal) el.dataset.esOriginal = el.textContent;
      el.textContent = lang === "en" ? el.getAttribute("data-en") : el.dataset.esOriginal;
    });

    $$("[data-en-html]").forEach(function (el) {
      if (!el.dataset.esHtmlOriginal) el.dataset.esHtmlOriginal = el.innerHTML;
      el.innerHTML = lang === "en" ? el.getAttribute("data-en-html") : el.dataset.esHtmlOriginal;
    });

    $$("[data-en-alt]").forEach(function (el) {
      if (!el.dataset.esAlt) el.dataset.esAlt = el.getAttribute("alt") || "";
      el.setAttribute("alt", lang === "en" ? el.getAttribute("data-en-alt") : el.dataset.esAlt);
    });

    $$("[data-en-aria-label]").forEach(function (el) {
      if (!el.dataset.esAriaLabel) el.dataset.esAriaLabel = el.getAttribute("aria-label") || "";
      el.setAttribute("aria-label", lang === "en" ? el.getAttribute("data-en-aria-label") : el.dataset.esAriaLabel);
    });

    $$(".lang-btn").forEach(function (btn) {
      var active = btn.getAttribute("data-lang") === lang;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
  }

  function initLangSwitch() {
    var switchers = $$("[data-lang-switch]");
    if (!switchers.length) return;
    switchers.forEach(function (switcher) {
      $$(".lang-btn", switcher).forEach(function (btn) {
        btn.addEventListener("click", function () {
          var lang = btn.getAttribute("data-lang");
          applyLang(lang);
          try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* ignore */ }
        });
      });
    });
    var saved = null;
    try { saved = localStorage.getItem(LANG_KEY); } catch (e) { /* ignore */ }
    if (saved === "en") applyLang("en");
  }

  /* ---------------------------------------------------------------------
     Contact form — no backend yet: build a mailto: with the message
     ------------------------------------------------------------------- */
  function initContactForm() {
    var form = $("[data-contact-form]");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;

      var nombre = ($("#f-nombre", form) || {}).value || "";
      var correo = ($("#f-correo", form) || {}).value || "";
      var telefono = ($("#f-telefono", form) || {}).value || "";
      var tipo = ($("#f-tipo", form) || {}).value || "";
      var mensaje = ($("#f-mensaje", form) || {}).value || "";

      var to = (data.contact && data.contact.email) || "info@jmmueblesdiseno.cr";
      var subject = "Solicitud de cotización — " + tipo;
      var body =
        "Nombre: " + nombre + "\n" +
        "Correo: " + correo + "\n" +
        "Teléfono: " + telefono + "\n" +
        "Tipo de proyecto: " + tipo + "\n\n" +
        mensaje;

      var mailto = "mailto:" + encodeURIComponent(to) +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);

      form.classList.add("is-sent");
      window.location.href = mailto;
    });
  }

  /* ---------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------- */
  function boot() {
    safe(initSplash, "initSplash");
    safe(initNav, "initNav");
    safe(initAnchorScroll, "initAnchorScroll");
    safe(initReveals, "initReveals");
    safe(initTilt, "initTilt");
    safe(initCarousel, "initCarousel");
    safe(initLangSwitch, "initLangSwitch");
    safe(initContactForm, "initContactForm");

    if (window.gsap && window.ScrollTrigger) {
      try { gsap.registerPlugin(ScrollTrigger); } catch (e) { /* ignore */ }
    }

    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
