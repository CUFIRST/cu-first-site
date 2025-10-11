// ============================================================
// CU FIRST — Main JavaScript
// Handles: mobile nav, footer year, event rendering, and form submission
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
// 4. Contact Form Submission via Google Apps Script
// ============================================================

// This script assumes it is loaded with <script defer src="assets/js/main.js"></script>
// so the DOM is ready when this code executes.

const form = document.getElementById("contactForm");
const status = document.getElementById("form-status");

// Replace this with your actual Apps Script deployment URL
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxcdyt33h0KnCpSKEmQYhh-0IQQ1-pRNXTo5t5stXpm-WN3H0nK3Tie7h2Nk3GPcKEj8Q/exec";

if (form) {
  console.log("CU FIRST contact form handler attached.");

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // Prevent default browser POST + query string
    status.textContent = "Sending…";

    const data = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      console.log("Apps Script response:", result);

      if (result.status === "success") {
        status.textContent = "Message sent successfully. Thank you!";
        form.reset();
      } else {
        status.textContent = "Error: Unable to send message.";
      }
    } catch (err) {
      console.error("Form send error:", err);
      status.textContent = "Network error — please try again later.";
    }
  });
} else {
  console.warn("Contact form not found — no handler attached.");
}
