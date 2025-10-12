// ============================================================
// CU FIRST — Main JavaScript
// Handles: mobile nav, footer year, event rendering, and form submission iframe handler
// Updated October 11/2025 - James Neumann
// ============================================================

// -----------------------------
// 1. Mobile Navigation Toggle
// -----------------------------
(function () {
  const btn = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");

  if (btn && nav) {
    btn.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
    });
  }

  // -----------------------------
  // 2. Dynamic Year in Footer
  // -----------------------------
  const y = document.getElementById("year");
  if (y) {
    y.textContent = new Date().getFullYear();
  }

  // -----------------------------
  // 3. Render Events from JSON attribute (fixed range detection + local-date parsing)
  // -----------------------------
  const holder = document.getElementById("event-cards");
  if (holder) {
    try {

      // ---- helpers ----
      function parseDateOnlyAsLocal(dateStr) {
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
        if (!m) return null;
        const year = Number(m[1]);
        const month = Number(m[2]) - 1;
        const day = Number(m[3]);
        return new Date(year, month, day);
      }

      function parseDateSmart(dateStr) {
        if (!dateStr && dateStr !== 0) return null;
        // If already a Date
        if (dateStr instanceof Date) return new Date(dateStr.getTime());
        dateStr = String(dateStr).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          return parseDateOnlyAsLocal(dateStr);
        }
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? null : d;
      }

      function fmtDate(d) {
        if (!d) return "";
        return d.toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      }

      function fmtDateRange(start, end) {
        if (!start && !end) return "";
        if (!end || start.getTime() === end.getTime()) return fmtDate(start);

        const sameYear = start.getFullYear() === end.getFullYear();
        const sameMonth = sameYear && start.getMonth() === end.getMonth();

        if (sameMonth) {
          const startDay = start.getDate();
          const endDay = end.getDate();
          return `${start.toLocaleDateString(undefined, { month: "short" })} ${startDay}–${endDay}, ${start.getFullYear()}`;
        } else if (sameYear) {
          const s = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
          const e = end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
          return `${s} — ${e}`;
        } else {
          const s = start.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
          const e = end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
          return `${s} — ${e}`;
        }
      }

      function escapeHtml(str) {
        if (str == null) return "";
        return String(str)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }

      // ---- robust range extraction ----
      function extractEventDates(ev) {
        // Explicit start/end preferred
        if (ev.start || ev.end) {
          const start = ev.start ? parseDateSmart(ev.start) : null;
          const end = ev.end ? parseDateSmart(ev.end) : null;
          return { start, end };
        }

        if (typeof ev.date === "string") {
          // Match two full YYYY-MM-DD tokens separated by -, to, –, or —
          const rangeMatch = ev.date.match(/(\d{4}-\d{2}-\d{2})\s*(?:-|to|–|—)\s*(\d{4}-\d{2}-\d{2})/i);
          if (rangeMatch) {
            const start = parseDateSmart(rangeMatch[1]);
            const end = parseDateSmart(rangeMatch[2]);
            return { start, end };
          }

          // Some users may write "YYYY-MM-DD to YYYY-MM-DD" (handled above)
          // If not a recognized range, treat the whole string as a single date
          const single = parseDateSmart(ev.date.trim());
          return { start: single, end: single };
        }

        // no date info
        return { start: null, end: null };
      }

      // ---- render ----
      const data = JSON.parse(holder.getAttribute("data-events") || "[]");

      holder.innerHTML = data
        .map((ev) => {
          const { start, end } = extractEventDates(ev);
          let dateText;
          if (start && end) dateText = fmtDateRange(start, end);
          else if (start) dateText = fmtDate(start);
          else dateText = "Date TBA";

          const titleHtml = ev.title || "";

          return `
            <article class="card">
              <h3>${titleHtml}</h3>
              <div class="meta">${escapeHtml(dateText)} — ${escapeHtml(ev.location || "TBD")}</div>
              <p>${escapeHtml(ev.desc || "")}</p>
              ${ev.link && ev.link !== "#" ? `<p><a href="${ev.link}" target="_blank" rel="noopener">Details</a></p>` : ""}
            </article>
          `;
        })
        .join("");
    } catch (err) {
      console.error("Failed to parse events", err);
    }
  }



})();

// ============================================================
// 4. Contact form submission via hidden iframe + postMessage
// ============================================================

(function () {
  const form = document.getElementById("contactForm");
  const status = document.getElementById("form-status");
  const iframe = document.getElementById("hidden_iframe");

  if (!form || !status) {
    console.warn("Contact form or status element not present.");
    return;
  }

  // When the form is submitted the browser performs a native POST and loads the response
  // into the hidden iframe. The Apps Script response posts a message to the parent window.
  form.addEventListener("submit", function (e) {
    // Show immediate feedback; actual success/error arrives via postMessage from iframe.
    status.textContent = "Sending…";

    // Failsafe / timeout if no message is received
    form._sendTimeout = setTimeout(() => {
      status.textContent = "Still sending — if this persists, please email cufirst.info@gmail.com";
    }, 12000);
  });

  // Accept postMessage from the iframe (Apps Script writes JS that posts to parent)
  window.addEventListener(
    "message",
    function (ev) {
      // Accept messages from the Apps Script iframe origin or from your site origin.
      // If your site origin is different from https://cu-first.ca, add it here.
      const allowedOrigins = [
        "https://script.google.com",
        "https://cu-first.ca",
        window.location.origin
      ];
      if (!allowedOrigins.includes(ev.origin)) {
        // ignore unexpected origins
        console.warn("Ignored postMessage from unexpected origin:", ev.origin);
        return;
      }

      const data = ev.data || {};
      if (form._sendTimeout) {
        clearTimeout(form._sendTimeout);
        form._sendTimeout = null;
      }

      if (data.status === "success") {
        status.textContent = "Message sent successfully. Thank you!";
        form.reset();
      } else if (data.status === "error") {
        const msg = data.message ? String(data.message) : "Please try again.";
        status.textContent = "Error sending message: " + msg;
      } else {
        // Unknown message — just log it
        console.log("Message from iframe:", data);
      }
    },
    false
  );
})();

// ============================================================
// 5. Hero slideshow: auto-cycle, indicators, controls, pause on hover
// ============================================================
(function () {
  const wrapper = document.getElementById("hero-slideshow");
  if (!wrapper) return;

  const slides = Array.from(wrapper.querySelectorAll(".slide"));
  const indicators = Array.from(wrapper.querySelectorAll(".indicator"));
  const prevBtn = wrapper.querySelector(".slide-control.prev");
  const nextBtn = wrapper.querySelector(".slide-control.next");

  let current = 0;
  let interval = null;
  const INTERVAL_MS = 5000; // cycle every 5s

  function show(index, { user = false } = {}) {
    index = (index + slides.length) % slides.length;
    slides.forEach((s, i) => {
      const active = i === index;
      s.classList.toggle("active", active);
      s.setAttribute("aria-hidden", String(!active));
    });
    indicators.forEach((btn, i) => {
      if (btn) btn.setAttribute("aria-pressed", String(i === index));
    });
    current = index;
    // if user manually navigates, restart autoplay
    if (user) {
      stop();
      start();
    }
  }

  function next() { show(current + 1, { user: false }); }
  function prev() { show(current - 1, { user: false }); }

  function start() {
    if (interval) return;
    interval = setInterval(next, INTERVAL_MS);
  }
  function stop() {
    if (!interval) return;
    clearInterval(interval);
    interval = null;
  }

  // controls
  if (prevBtn) prevBtn.addEventListener("click", () => { prev(); show(current, { user: true }); });
  if (nextBtn) nextBtn.addEventListener("click", () => { next(); show(current, { user: true }); });

  // indicators
  indicators.forEach((btn, idx) => {
    btn.addEventListener("click", () => { show(idx, { user: true }); });
  });

  // keyboard access
  wrapper.addEventListener("keydown", (ev) => {
    if (ev.key === "ArrowLeft") { prev(); show(current, { user: true }); }
    if (ev.key === "ArrowRight") { next(); show(current, { user: true }); }
  });

  // pause on hover/focus
  wrapper.addEventListener("mouseenter", stop);
  wrapper.addEventListener("mouseleave", start);
  wrapper.addEventListener("focusin", stop);
  wrapper.addEventListener("focusout", start);

  // initialize
  show(0);
  start();
})();


// Ensure hero fills the remaining viewport height under the header (max vertical)
(function(){
  function setHeroMaxHeight(){
    const header = document.querySelector('.site-header');
    const hero = document.querySelector('.hero');
    if(!hero) return;
    const headerH = header ? header.getBoundingClientRect().height : 0;
    // set CSS custom property or inline style - inline is simplest and reliable:
    const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    const target = Math.max(360, Math.floor(vh - headerH)); // ensure a sensible min height
    hero.style.minHeight = target + 'px';
    hero.style.height = target + 'px';
  }

  // debounce helper
  let t;
  function onResize(){
    clearTimeout(t);
    t = setTimeout(setHeroMaxHeight, 120);
  }

  // init
  window.addEventListener('load', setHeroMaxHeight);
  window.addEventListener('resize', onResize);
  // also call right away in case script loads after DOM ready
  setHeroMaxHeight();
})();

