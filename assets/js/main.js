// Small JS: mobile nav, current year, and event rendering
(function(){
  const btn = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  if(btn && nav){
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
  }
  // year
  const y = document.getElementById('year');
  if(y){ y.textContent = new Date().getFullYear(); }

  // Render events from data-attribute
  const holder = document.getElementById('event-cards');
  if(holder){
    try{
      const data = JSON.parse(holder.getAttribute('data-events') || '[]');
      holder.innerHTML = data.map(ev => `
        <article class="card">
          <h3>${ev.title}</h3>
          <div class="meta">${new Date(ev.date).toLocaleDateString(undefined, {year:'numeric',month:'short',day:'numeric'})} — ${ev.location}</div>
          <p>${ev.desc}</p>
          ${ev.link && ev.link !== '#' ? `<p><a href="${ev.link}" target="_blank" rel="noopener">Details</a></p>` : ''}
        </article>
      `).join('');
    }catch(e){
      console.error('Failed to parse events', e);
    }
  }
})();

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("contactForm");
  const status = document.getElementById("form-status");

  // Replace this with your actual Apps Script URL
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxcdyt33h0KnCpSKEmQYhh-0IQQ1-pRNXTo5t5stXpm-WN3H0nK3Tie7h2Nk3GPcKEj8Q/exec";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "Sending…";

    const data = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (result.status === "success") {
        status.textContent = "Message sent successfully. Thank you!";
        form.reset();
      } else {
        status.textContent = "Error: Unable to send message.";
      }
    } catch (err) {
      console.error(err);
      status.textContent = "Network error — please try again later.";
    }
  });
});
