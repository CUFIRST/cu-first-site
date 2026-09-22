// ============================================================
// CU FIRST — Main JavaScript
// Handles: mobile nav, footer year, event rendering, and form submission iframe handler
// Updated June 06/2026 - Spencer Rodrigues
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
    if (start && end) {
      dateText = fmtDateRange(start, end);
    } else if (start) {
      dateText = fmtDate(start);
    } else {
      dateText = "Date TBA";
    }

    const titleHtml = escapeHtml(ev.title || "");

    // -----------------------------
    // Event links
    // -----------------------------
    let linksHtml = "";

    // Multiple named links
    if (Array.isArray(ev.links)) {
      linksHtml = ev.links
        .filter(link => link && link.url)
        .map(link => {
          const label = escapeHtml(link.label || "Details");
          const url = escapeHtml(link.url);

          return `
            <a href="${url}" target="_blank" rel="noopener">
              ${label}
            </a>
          `;
        })
        .join("<br>");
    }

    // Single link
    else if (ev.link && ev.link !== "#") {
      const url = escapeHtml(ev.link);

      linksHtml = `
        <a href="${url}" target="_blank" rel="noopener">
          Details
        </a>
      `;
    }

    return `
      <article class="card">
        <h3>${titleHtml}</h3>

        <div class="meta">
          ${escapeHtml(dateText)} —
          ${escapeHtml(ev.location || "TBD")}
        </div>

        <p>
          ${escapeHtml(ev.desc || "")}
        </p>

        ${
          linksHtml
            ? `<p class="event-links">${linksHtml}</p>`
            : ""
        }
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
// 4. Hero slideshow
// ============================================================
(function () {
  const slideshow = document.getElementById("hero-slideshow");
  if (!slideshow) return;

  const slides = Array.from(slideshow.querySelectorAll(".slide"));
  if (slides.length < 2) return;

  const controls = slideshow.querySelector(".slideshow-controls");
  const dots = slideshow.querySelector(".slideshow-dots");
  const pauseButton = slideshow.querySelector('[data-slide-action="toggle"]');
  const maxVisibleDots = 5;
  let currentIndex = slides.findIndex((slide) => slide.classList.contains("active"));
  if (currentIndex < 0) currentIndex = 0;
  let manuallyPaused = false;
  let temporarilyPaused = false;

  function updateControls() {
    if (!dots) return;

    const visibleDotCount = Math.min(maxVisibleDots, slides.length);
    const firstVisibleIndex = Math.min(
      Math.max(0, currentIndex - Math.floor(visibleDotCount / 2)),
      slides.length - visibleDotCount
    );

    Array.from(dots.children).forEach((dot, position) => {
      const slideIndex = firstVisibleIndex + position;
      const selected = slideIndex === currentIndex;
      dot.dataset.slideIndex = String(slideIndex);
      dot.classList.toggle("active", selected);
      dot.setAttribute("aria-current", selected ? "true" : "false");
      dot.setAttribute("aria-label", `Show slide ${slideIndex + 1}`);
    });
  }

  function showSlide(index) {
    slides[currentIndex].classList.remove("active");
    slides[currentIndex].setAttribute("aria-hidden", "true");
    currentIndex = (index + slides.length) % slides.length;
    slides[currentIndex].classList.add("active");
    slides[currentIndex].setAttribute("aria-hidden", "false");
    updateControls();
  }

  function shouldPause() {
    return manuallyPaused || temporarilyPaused;
  }

  function updatePauseButton() {
    if (!pauseButton) return;
    const paused = manuallyPaused;
    pauseButton.setAttribute("aria-label", paused ? "Play slideshow" : "Pause slideshow");
    pauseButton.innerHTML = paused ? "&#9654;" : "&#10074;&#10074;";
  }

  if (dots) {
    const visibleDotCount = Math.min(maxVisibleDots, slides.length);
    Array.from({ length: visibleDotCount }, () => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "slideshow-dot";
      dot.addEventListener("click", () => {
        showSlide(Number(dot.dataset.slideIndex));
      });
      dots.appendChild(dot);
    });
  }

  if (controls) {
    controls.addEventListener("click", (event) => {
      const button = event.target.closest("[data-slide-action]");
      if (!button) return;

      const action = button.dataset.slideAction;
      if (action === "previous") showSlide(currentIndex - 1);
      if (action === "next") showSlide(currentIndex + 1);
      if (action === "toggle") {
        manuallyPaused = !manuallyPaused;
        updatePauseButton();
      }
    });

    controls.addEventListener("mouseenter", () => {
      temporarilyPaused = true;
    });
    controls.addEventListener("mouseleave", () => {
      temporarilyPaused = false;
    });
  }

  slideshow.addEventListener("focusin", () => {
    temporarilyPaused = true;
  });
  slideshow.addEventListener("focusout", (event) => {
    if (!slideshow.contains(event.relatedTarget)) temporarilyPaused = false;
  });

  updateControls();
  updatePauseButton();

  setInterval(() => {
    if (!shouldPause()) showSlide(currentIndex + 1);
  }, 6000);
})();

// ============================================================
// 5. Contact form submission to the existing endpoint and Discord proxy
// ============================================================
(function () {
  const form = document.getElementById("contactForm");
  const status = document.getElementById("form-status");
  const message = document.getElementById("message");
  const messageCount = document.getElementById("message-count");

  if (!form || !status) {
    console.warn("Contact form or status element not present.");
    return;
  }

  const discordProxyUrl = form.dataset.discordProxyUrl;

  function updateMessageCount() {
    if (!message || !messageCount) return;
    messageCount.textContent = `${message.value.length}/${message.maxLength}`;
    messageCount.dataset.limit = message.value.length >= message.maxLength ? "reached" : "";
  }

  if (message) {
    message.addEventListener("input", updateMessageCount);
    updateMessageCount();
  }

  function setStatus(message, state) {
    status.textContent = message;
    status.dataset.state = state;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    setStatus("Sending…", "sending");

    const formData = new URLSearchParams(new FormData(form));
    const request = (endpoint) => fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: formData,
    });
    const requestWithTimeout = (endpoint) => Promise.race([
      request(endpoint),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timed out.")), 30000);
      }),
    ]);

    // The existing endpoint is independent and does not control the status message.
    if (form.action) {
      request(form.action).catch((error) => {
        console.error("Existing Apps Script submission failed:", error);
      });
    }

    if (!discordProxyUrl || discordProxyUrl === "PASTE_NEW_APPS_SCRIPT_EXEC_URL_HERE") {
      setStatus("Error sending message. Please email us at cufirst.info+contact@gmail.com", "error");
      return;
    }

    requestWithTimeout(discordProxyUrl)
      .then(() => {
        setStatus("Message received successfully! If you do not hear from us within 48 hours, please email us at cufirst.info+contact@gmail.com", "success");
        form.reset();
      })
      .catch((error) => {
        console.error("Contact form submission failed:", error);
        setStatus("Error sending message. Please email us at cufirst.info+contact@gmail.com", "error");
      });
  });

  if (!form.action || !discordProxyUrl) {
    console.warn("One or more contact form endpoints are missing.");
  }

})();

