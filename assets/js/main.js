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
  // 3. Render Events from JSON attribute
  // -----------------------------
  const holder = document.getElementById("event-cards");
  if (holder) {
    try {
      const data = JSON.parse(holder.getAttribute("data-events") || "[]");
      holder.innerHTML = data
        .map(
          (ev) => `
        <article class="card">
          <h3>${ev.title}</h3>
          <div class="meta">
            ${new Date(ev.date).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })} — ${ev.location}
          </div>
          <p>${ev.desc}</p>
          ${
            ev.link && ev.link !== "#"
              ? `<p><a href="${ev.link}" target="_blank" rel="noopener">Details</a></p>`
              : ""
          }
        </article>
      `
        )
        .join("");
    } catch (e) {
      console.error("Failed to parse events", e);
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
