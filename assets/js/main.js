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
// 4. Contact form submission via hidden iframe + postMessage + Discord webhook
// ============================================================
(function () {
  const form = document.getElementById("contactForm");
  const status = document.getElementById("form-status");
  const iframe = document.getElementById("hidden_iframe");
  const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1549518453063549029/6YcGaOwY0TjwSube6O0GQOCgLcJ54Cs9cdS-VAmV4-zzfKZUn0mvVm4MwdIeYoM-DDEx";
  
  if (!form || !status) {
    console.warn("Contact form or status element not present.");
    return;
  }

  // Track submission state
  form._submissionState = {
    discordSuccess: null,
  };

  function checkSubmissionComplete() {
    const state = form._submissionState;
    if (state.discordSuccess === null) {
      return; // Still waiting for Discord response
    }

    if (form._sendTimeout) {
      clearTimeout(form._sendTimeout);
      form._sendTimeout = null;
    }

    if (state.discordSuccess) {
      status.textContent = "Message sent successfully. Thank you!";
      form.reset();
    } else {
      status.textContent = "Error sending message. Please email us at cufirst.info@gmail.com";
    }
  }

  // When the form is submitted the browser performs a native POST and loads
  // the response into the hidden iframe, bypassing CORS entirely.
  form.addEventListener("submit", function (e) {
    status.textContent = "Sending…";
    form._submissionState = { discordSuccess: null };

    // Send to Discord webhook
    if (form.querySelector('[name="name"]') && form.querySelector('[name="email"]') && form.querySelector('[name="message"]')) {
      const name = form.querySelector('[name="name"]').value || "Anonymous";
      const email = form.querySelector('[name="email"]').value || "No email provided";
      const role = form.querySelector('[name="role"]').value || "No role provided";
      const message = form.querySelector('[name="message"]').value || "No message provided";

      const discordPayload = {
        embeds: [
          {
            title: "New Contact Form Submission",
            color: 16711680, // Red color
            fields: [
              {
                name: "Name",
                value: name,
                inline: false,
              },
              {
                name: "Email",
                value: email,
                inline: false,
              },
              {
                name: "Role",
                value: role,
                inline: false,
              },
              {
                name: "Message",
                value: message,
                inline: false,
              },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
      };

      fetch(DISCORD_WEBHOOK, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(discordPayload),
      })
        .then((response) => {
          form._submissionState.discordSuccess = response.ok;
          checkSubmissionComplete();
        })
        .catch((err) => {
          console.error("Failed to send Discord webhook:", err);
          form._submissionState.discordSuccess = false;
          checkSubmissionComplete();
        });
    } else {
      form._submissionState.discordSuccess = false;
      checkSubmissionComplete();
    }

    // Failsafe timeout if Discord doesn't respond
    form._sendTimeout = setTimeout(() => {
      if (form._submissionState.discordSuccess === null) {
        form._submissionState.discordSuccess = false;
        checkSubmissionComplete();
      }
    }, 8000);
  });

  // Keep iframe postMessage listener for Apps Script form submission (silent)
  window.addEventListener(
    "message",
    function (ev) {
      const data = ev.data || {};
      // Just log for debugging, don't update status anymore
      if (data.status === "success") {
        console.log("Form saved to Apps Script");
      } else if (data.status === "error") {
        console.error("Apps Script error:", data.message);
      }
    },
    false
  );
})();

