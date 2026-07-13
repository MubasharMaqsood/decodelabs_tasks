# Access Control Checkpoint — Project 4: Form Design & Validation

A DecodeLabs Project 4 submission. A registration form with fully custom
JavaScript validation, no libraries or frameworks.

## Files

- `index.html` — semantic form markup (proper `<label>`, `<input>`,
  `<button type="submit">` — no `<div>` soup)
- `style.css` — the "blueprint checkpoint" visual system
- `script.js` — validation engine, regex gates, ARIA wiring

## How it covers the brief

| Brief requirement | Where it lives |
|---|---|
| Input fields (name, email, password, confirm) | `index.html` |
| Block the default page refresh | `form.addEventListener('submit', e => e.preventDefault())` in `script.js` |
| Email syntax check | `PATTERNS.email` regex in `script.js` |
| Strict password policy (upper/lower/digit/symbol/length) | `PATTERNS` + `validatePassword()` in `script.js` |
| Error & success messaging | `.field__msg` elements, toggled per field |
| `aria-invalid` / `aria-describedby` tether | set on every input, wired to its error `<p>` |
| Polite live region (no announcing mid-keystroke) | `#form-status[aria-live="polite"]`, only updated on blur/submit |
| JSON payload on success | built and rendered in the success receipt panel |

## Signature element

The **Gate Inspector** panel on the right is a live readout of every
validation gate (name present, email syntax, each password rule,
password match) plus a running JSON preview — so the "logic gates and
payload" language from the brief isn't just copy, it's something you can
watch happen as you type.

## Running it

Open `index.html` directly in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

No build step, no dependencies, no network calls — everything runs
client-side, exactly as scoped.
