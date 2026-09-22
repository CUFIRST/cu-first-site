# CU FIRST — Static Site

A minimal, fast, accessible static site for CU FIRST using **plain HTML/CSS/JS**. Designed for **GitHub Pages**.

## Local preview
Open `index.html` in a browser.

## Deploy on GitHub Pages
1. Create a new public repo on GitHub, e.g., `cu-first-site`.
2. Upload all files in this folder to the repo (or push via git).
3. In **Settings → Pages**, set:
   - **Source:** `Deploy from a branch`
   - **Branch:** `main` (or `master`) / root (`/`)
4. Save. Your site will be available at `https://<username>.github.io/<repo>/`.

### Custom domain (optional)
- Add your domain in **Settings → Pages** and create the required DNS `CNAME` record.
- If you know the domain now, create a `CNAME` file at the repo root containing it.

## Contact form Discord proxy

The contact form makes two separate background submissions:

- One URL-encoded POST goes to the existing Apps Script endpoint.
- A second URL-encoded POST goes to the new endpoint in `google-apps-script/Code.gs`, which forwards the message to Discord.

The POST requests use `no-cors` because Apps Script responses cannot be read by the browser from this static site. The proxy itself returns JSON: `{"success":true}` only after Discord returns 2xx, or `{"success":false,"message":"..."}` when forwarding fails. The site displays success after the proxy request is sent because the browser cannot read that JSON without a CORS-capable backend.

To configure the second call:

1. Create a new Google Apps Script project and paste in `google-apps-script/Code.gs`.
2. In **Project Settings → Script properties**, add `DISCORD_WEBHOOK_URL` with the Discord webhook as its value.
3. Deploy it as a web app, executed as you, accessible to anyone.
4. Replace `PASTE_NEW_APPS_SCRIPT_EXEC_URL_HERE` in `index.html` with the deployed `/exec` URL.
5. After code changes, create a new deployment version or update the existing deployment so `doPost` uses the latest code.

To diagnose delivery directly in Apps Script, select `testWebhook` in the function dropdown and click **Run**. It sends one clearly labeled diagnostic message. Open **Executions** and inspect the logs for `Discord response: HTTP ...`. A `204` response means Discord accepted the webhook; a `401`, `404`, or `400` response includes the exact reason.

The Discord webhook must only exist in Script Properties, never in frontend code. Since the previous webhook was exposed in `assets/js/main.js`, regenerate it in Discord after switching to the proxy.

## Content guide
- Edit text in `index.html`.
- Colors are restricted to **red / black / white** with a **white page background** to match CU FIRST style.
- Replace `assets/img/sponsor-placeholder.svg` with real logos.
- Contact form uses **Formspree**; replace `your_form_id` in the form action with your endpoint.

## Accessibility & performance
- Semantic HTML, keyboard‑friendly nav, and reduced JS.
- Mobile‑first responsive CSS (no frameworks).
- Social/SEO meta tags included.

## License
MIT
