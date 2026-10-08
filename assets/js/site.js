/* =====================================================================
   BANKATA.AI — site script (no libraries, no build step)
   Progressive enhancement: every page reads fine without JavaScript.
   ===================================================================== */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  /* ---------- SETTINGS (edit here) ----------
     EMAIL    : public contact email. Empty "" = no email shown anywhere.
     WHATSAPP : WhatsApp number, digits only with country code (e.g. "91XXXXXXXXXX"). Empty "" = no WhatsApp shown.
     GOOGLE_FORM : enquiries go straight to a Google Form (and its Google Sheet).
        action : the form's "formResponse" URL
        fields : our field names -> the Google Form's entry ids
        Empty action "" = the form explains that enquiries open soon. */
  var EMAIL = "bankata@gmail.com";
  var WHATSAPP = "";
  var GOOGLE_FORM = {
    // Google Form "Bankata.AI enquiry" (edit link in NOTES.md)
    action: "https://docs.google.com/forms/d/e/1FAIpQLSebwJfBmqBTze4cPm7DdDu1-Zg7IDcGcerC1YKgAeXUaQDxkQ/formResponse",
    fields: { name: "entry.870069208", email: "entry.1257485046", phone: "entry.1526651638", org: "entry.470928408", role: "entry.984103590",
              product: "entry.677376076", type: "entry.1102881192", message: "entry.176399003", updates: "entry.1518000742" }
  };

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- contact links: shown only when set ---------- */
  $$("[data-contact='email']").forEach(function (el) {
    if (!EMAIL) { el.hidden = true; return; }
    el.hidden = false;
    var a = el.tagName === "A" ? el : $("a", el);
    if (a) a.href = "mailto:" + EMAIL;
    $$("[data-email-text]", el).forEach(function (t) { t.textContent = EMAIL; });
  });
  $$("[data-contact='whatsapp']").forEach(function (el) {
    if (!WHATSAPP) { el.hidden = true; return; }
    el.hidden = false;
    var a = el.tagName === "A" ? el : $("a", el);
    if (a) a.href = "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent("Hello, I found Bankata.AI and would like to know more.");
  });
  $$("[data-contact-any]").forEach(function (el) { el.hidden = !(EMAIL || WHATSAPP); });

  /* ---------- header + mobile menu ---------- */
  var head = $(".site-head");
  var toggle = $(".nav-toggle");
  var nav = $("#site-nav");
  var ICON_OPEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg><span class="sr-only">Open menu</span>';
  var ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg><span class="sr-only">Close menu</span>';
  if (toggle && nav) {
    var setOpen = function (open) {
      nav.classList.toggle("open", open);
      document.body.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.innerHTML = open ? ICON_CLOSE : ICON_OPEN;
    };
    toggle.addEventListener("click", function () { setOpen(!nav.classList.contains("open")); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
    window.addEventListener("resize", function () { if (window.innerWidth >= 1100) setOpen(false); });
  }
  var floatBox = $(".float");
  var onScroll = function () {
    var y = window.scrollY || 0;
    if (head) head.classList.toggle("scrolled", y > 8);
    if (floatBox) floatBox.classList.toggle("show", y > 700);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  var top = $(".to-top");
  if (top) top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });

  /* ---------- hero switchboard ---------- */
  var board = $(".board");
  if (board && $("#board-data")) {
    var data = JSON.parse($("#board-data").textContent);
    var keys = $$(".board-key", board);
    var body = $(".board-body", board);
    var inLabel = $("[data-b='inlabel']", board), input = $("[data-b='input']", board),
        outLabel = $("[data-b='outlabel']", board), out = $("[data-b='out']", board),
        link = $("[data-b='link']", board), name = $("[data-b='name']", board);
    var idx = 0, timers = [], auto = !reduce, cycle = null;
    var clear = function () { timers.forEach(clearTimeout); timers = []; };
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
    var show = function (i, instant) {
      clear();
      idx = i;
      var d = data[i];
      keys.forEach(function (k, j) { k.setAttribute("aria-selected", j === i ? "true" : "false"); k.tabIndex = j === i ? 0 : -1; });
      board.setAttribute("data-c", d.c);
      if (board.parentNode.classList.contains("board-wrap")) board.parentNode.setAttribute("data-c", d.c);
      inLabel.textContent = d.in_label;
      outLabel.textContent = d.out_label;
      name.textContent = d.name;
      link.href = d.href;
      out.innerHTML = d.lines.map(function (l) {
        return "<li><b>" + esc(l[0]) + "</b>" + (l[2] ? "<span><mark>" + esc(l[1]) + "</mark></span>" : '<span class="same">' + esc(l[1]) + "</span>") + "</li>";
      }).join("");
      var items = $$("li", out);
      if (instant) {
        input.textContent = d.input;
        items.forEach(function (li) { li.classList.add("on"); });
        return;
      }
      input.innerHTML = '<span class="t"></span><span class="caret"></span>';
      var t = $(".t", input), n = 0, text = d.input;
      var step = Math.max(14, Math.min(34, 1700 / text.length));
      var type = function () {
        n++;
        t.textContent = text.slice(0, n);
        if (n < text.length) { timers.push(setTimeout(type, step)); }
        else {
          var c = $(".caret", input); if (c) c.remove();
          items.forEach(function (li, j) { timers.push(setTimeout(function () { li.classList.add("on"); }, 260 + j * 380)); });
        }
      };
      type();
    };
    keys.forEach(function (k, i) {
      k.addEventListener("click", function () { auto = false; if (cycle) clearInterval(cycle); show(i, reduce); });
      k.addEventListener("keydown", function (e) {
        var dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        var j = (idx + dir + keys.length) % keys.length;
        auto = false; if (cycle) clearInterval(cycle);
        show(j, reduce); keys[j].focus();
      });
    });
    show(0, reduce);
    if (auto) {
      cycle = setInterval(function () { if (auto && !document.hidden) show((idx + 1) % data.length); }, 7000);
      board.addEventListener("mouseenter", function () { auto = false; });
      board.addEventListener("mouseleave", function () { auto = !reduce && !board.dataset.chosen; });
      keys.forEach(function (k) { k.addEventListener("click", function () { board.dataset.chosen = "1"; }); });
    }
  }

  /* ---------- role picker ---------- */
  var picker = $(".picker");
  if (picker) {
    var chips = $$(".chip", picker), result = $(".pick-result", picker), roles = JSON.parse($("#role-data").textContent);
    var pick = function (i) {
      chips.forEach(function (c, j) { c.setAttribute("aria-pressed", j === i ? "true" : "false"); });
      var r = roles[i];
      result.setAttribute("data-c", r.c);
      result.innerHTML = '<p class="muted small">Our suggestion</p><h3>' + r.icon + r.name + "</h3><p>" + r.why + '</p><div class="btns"><a class="btn btn-c" href="' + r.page + '">See ' + r.name + '</a><a class="btn btn-line" href="' + r.open + '" target="_blank" rel="noopener">Open the app</a></div>';
    };
    chips.forEach(function (c, i) { c.addEventListener("click", function () {
      pick(i);
      if (window.innerWidth < 900) result.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
    }); });
  }

  /* ---------- YouTube: load only on click (privacy-enhanced) ---------- */
  $$(".vid-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      var id = b.getAttribute("data-yt"), title = b.getAttribute("data-title") || "Video";
      var f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0&modestbranding=1";
      f.title = title;
      f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      f.allowFullscreen = true;
      f.loading = "lazy";
      b.replaceWith(f);
      f.focus();
    });
  });

  /* ---------- video filters ---------- */
  var filters = $$(".filter");
  if (filters.length) {
    filters.forEach(function (f) {
      f.addEventListener("click", function () {
        var v = f.getAttribute("data-f");
        filters.forEach(function (x) { x.setAttribute("aria-pressed", x === f ? "true" : "false"); });
        $$(".vid-grid .vid").forEach(function (el) { el.hidden = !(v === "all" || el.getAttribute("data-p") === v); });
      });
    });
  }

  /* ---------- enquiry forms ---------- */
  var params = new URLSearchParams(location.search);
  $$("form.enquiry").forEach(function (form) {
    var msg = $(".form-msg", form);
    var preset = params.get("product");
    if (preset && form.product) {
      Array.prototype.forEach.call(form.product.options, function (o) { if (o.value === preset) form.product.value = preset; });
    }
    var ptype = params.get("type");
    if (ptype && form.type) {
      Array.prototype.forEach.call(form.type.options, function (o) { if (o.value === ptype) form.type.value = ptype; });
    }
    var say = function (cls, text) { msg.className = "form-msg " + cls; msg.textContent = text; msg.hidden = false; msg.setAttribute("tabindex", "-1"); msg.focus(); };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.website && form.website.value) return; // spam trap
      var bad = [];
      $$("[required]", form).forEach(function (el) {
        var ok = el.type === "checkbox" ? el.checked : el.value.trim() !== "" && (el.type !== "email" || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.value.trim()));
        el.setAttribute("aria-invalid", ok ? "false" : "true");
        if (!ok) bad.push(el);
      });
      if (bad.length) { say("err", "Please fill in the highlighted fields: your name and a valid email address."); bad[0].focus(); return; }
      if (!GOOGLE_FORM.action) { say("err", "Online enquiries open very soon. Please check back shortly."); return; }

      var fd = new FormData();
      Object.keys(GOOGLE_FORM.fields).forEach(function (k) {
        var id = GOOGLE_FORM.fields[k], el = form.elements[k];
        if (!id || !el) return;
        var val = el.type === "checkbox" ? (el.checked ? "Yes" : "No") : el.value.trim();
        if (val) fd.append(id, val);
      });
      var btn = $("button[type=submit]", form);
      btn.disabled = true;
      fetch(GOOGLE_FORM.action, { method: "POST", mode: "no-cors", body: fd })
        .then(function () { form.reset(); say("ok", "Thank you. Your message has been sent and we will reply soon."); })
        .catch(function () { say("err", "The message could not be sent. Check your internet connection and try again."); })
        .then(function () { btn.disabled = false; });
    });
  });
})();
