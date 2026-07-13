(() => {
  'use strict';

  /* ------------------------------------------------------------------
   * Phase 3 (Scan): the regex logic gates.
   * ------------------------------------------------------------------ */
  const PATTERNS = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    upper: /[A-Z]/,
    lower: /[a-z]/,
    digit: /[0-9]/,
    symbol: /[#?!@$%^&*\-]/,
  };
  const MIN_PASSWORD_LENGTH = 8;

  const form = document.getElementById('access-form');
  const status = document.getElementById('form-status');
  const payloadPreview = document.getElementById('payload-preview');
  const receipt = document.getElementById('receipt');
  const receiptJson = document.getElementById('receipt-json');
  const resetBtn = document.getElementById('reset-btn');
  const revealBtn = document.getElementById('reveal-password');
  const passwordInput = document.getElementById('password');
  const pipelineStages = document.querySelectorAll('.pipeline__stage');

  const inputs = {
    fullName: document.getElementById('fullName'),
    email: document.getElementById('email'),
    password: document.getElementById('password'),
    confirmPassword: document.getElementById('confirmPassword'),
  };

  const gates = {};
  document.querySelectorAll('.gate').forEach((el) => {
    gates[el.dataset.gate] = el;
  });

  /* ------------------------------------------------------------------
   * Gate inspector — the live signature panel. Purely visual feedback,
   * updated on every keystroke (this is not an ARIA live region, so it
   * never spams assistive tech).
   * ------------------------------------------------------------------ */
  function setGate(name, passed) {
    const gate = gates[name];
    if (!gate) return;
    gate.classList.remove('is-pass', 'is-fail');
    const stateEl = gate.querySelector('.gate__state');
    if (passed === null) {
      stateEl.textContent = 'pending';
      return;
    }
    gate.classList.add(passed ? 'is-pass' : 'is-fail');
    stateEl.textContent = passed ? 'pass' : 'fail';
  }

  function evaluateGates() {
    const name = inputs.fullName.value.trim();
    const email = inputs.email.value.trim();
    const pwd = inputs.password.value;
    const confirm = inputs.confirmPassword.value;

    setGate('fullName', name.length ? true : null);
    setGate('email', email.length ? PATTERNS.email.test(email) : null);
    setGate('passwordUpper', pwd.length ? PATTERNS.upper.test(pwd) : null);
    setGate('passwordLower', pwd.length ? PATTERNS.lower.test(pwd) : null);
    setGate('passwordDigit', pwd.length ? PATTERNS.digit.test(pwd) : null);
    setGate('passwordSymbol', pwd.length ? PATTERNS.symbol.test(pwd) : null);
    setGate('passwordLength', pwd.length ? pwd.length >= MIN_PASSWORD_LENGTH : null);
    setGate('confirmPassword', confirm.length ? confirm === pwd && pwd.length > 0 : null);

    updatePayloadPreview({ name, email, pwd, confirm });
  }

  function updatePayloadPreview({ name, email, pwd, confirm }) {
    const anyContent = name || email || pwd || confirm;
    if (!anyContent) {
      payloadPreview.textContent = JSON.stringify({ status: 'awaiting input' }, null, 2);
      return;
    }
    payloadPreview.textContent = JSON.stringify(
      {
        fullName: name || null,
        email: email || null,
        password: pwd ? '•'.repeat(Math.min(pwd.length, 12)) : null,
        passwordsMatch: pwd.length > 0 ? pwd === confirm : null,
      },
      null,
      2
    );
  }

  /* ------------------------------------------------------------------
   * Per-field validators. Each returns an error string, or '' if valid.
   * ------------------------------------------------------------------ */
  function validateFullName() {
    const value = inputs.fullName.value.trim();
    if (!value) return 'Enter your full name.';
    if (value.length < 2) return 'Name must be at least 2 characters.';
    return '';
  }

  function validateEmail() {
    const value = inputs.email.value.trim();
    if (!value) return 'Enter an email address.';
    if (!PATTERNS.email.test(value)) return 'Enter a valid email address (e.g. name@domain.com).';
    return '';
  }

  function validatePassword() {
    const value = inputs.password.value;
    if (!value) return 'Enter a password.';
    const missing = [];
    if (!PATTERNS.upper.test(value)) missing.push('an uppercase letter');
    if (!PATTERNS.lower.test(value)) missing.push('a lowercase letter');
    if (!PATTERNS.digit.test(value)) missing.push('a number');
    if (!PATTERNS.symbol.test(value)) missing.push('a symbol (#?!@$%^&*-)');
    if (value.length < MIN_PASSWORD_LENGTH) missing.push(`${MIN_PASSWORD_LENGTH}+ characters`);
    if (missing.length) return `Password needs: ${missing.join(', ')}.`;
    return '';
  }

  function validateConfirmPassword() {
    const value = inputs.confirmPassword.value;
    if (!value) return 'Confirm your password.';
    if (value !== inputs.password.value) return 'Passwords do not match.';
    return '';
  }

  const VALIDATORS = {
    fullName: validateFullName,
    email: validateEmail,
    password: validatePassword,
    confirmPassword: validateConfirmPassword,
  };

  /* ------------------------------------------------------------------
   * Applies a validation result to the DOM: the ARIA tether between
   * input and error message, plus the field-level valid/invalid state.
   * ------------------------------------------------------------------ */
  function applyFieldResult(name, errorMessage) {
    const input = inputs[name];
    const fieldEl = input.closest('.field');
    const errorEl = document.getElementById(`${name}-error`);

    if (errorMessage) {
      input.setAttribute('aria-invalid', 'true');
      errorEl.textContent = errorMessage;
      fieldEl.dataset.state = 'invalid';
    } else {
      input.setAttribute('aria-invalid', 'false');
      errorEl.textContent = '';
      fieldEl.dataset.state = 'valid';
    }
    return !errorMessage;
  }

  function validateField(name, { announce = false } = {}) {
    const errorMessage = VALIDATORS[name]();
    const isValid = applyFieldResult(name, errorMessage);
    if (announce && !isValid) {
      status.textContent = errorMessage;
    }
    return isValid;
  }

  /* ------------------------------------------------------------------
   * Wiring: gates update live on every keystroke (visual only).
   * Error text + announcements wait for blur, per the "polite" live
   * region pattern — never interrupt an in-progress keystroke.
   * ------------------------------------------------------------------ */
  Object.entries(inputs).forEach(([name, el]) => {
    el.addEventListener('input', evaluateGates);
    el.addEventListener('blur', () => {
      if (el.value.length > 0) validateField(name, { announce: true });
    });
  });

  // Confirm-password should re-check whenever the primary password changes.
  inputs.password.addEventListener('input', () => {
    if (inputs.confirmPassword.value) validateField('confirmPassword');
  });

  revealBtn.addEventListener('click', () => {
    const showing = passwordInput.type === 'text';
    passwordInput.type = showing ? 'password' : 'text';
    revealBtn.setAttribute('aria-pressed', String(!showing));
    revealBtn.querySelector('.reveal-btn__text').textContent = showing ? 'show' : 'hide';
  });

  /* ------------------------------------------------------------------
   * Phase 2 (Shield): stop the browser's default full-page refresh,
   * then run every gate before anything is treated as "submitted".
   * ------------------------------------------------------------------ */
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const fieldNames = Object.keys(inputs);
    const results = fieldNames.map((name) => validateField(name, { announce: false }));
    const allValid = results.every(Boolean);

    if (!allValid) {
      const firstInvalid = fieldNames[results.indexOf(false)];
      inputs[firstInvalid].focus();
      status.textContent = 'Some fields need attention before this payload can be transmitted.';
      return;
    }

    const payload = {
      fullName: inputs.fullName.value.trim(),
      email: inputs.email.value.trim(),
      password: '•'.repeat(inputs.password.value.length),
      submittedAt: new Date().toISOString(),
    };

    receiptJson.textContent = JSON.stringify(payload, null, 2);
    form.hidden = true;
    receipt.hidden = false;
    status.textContent = 'Payload approved and transmitted.';
    receipt.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  resetBtn.addEventListener('click', () => {
    form.reset();
    form.hidden = false;
    receipt.hidden = true;
    Object.keys(inputs).forEach((name) => {
      const fieldEl = inputs[name].closest('.field');
      delete fieldEl.dataset.state;
      inputs[name].setAttribute('aria-invalid', 'false');
      document.getElementById(`${name}-error`).textContent = '';
    });
    Object.keys(gates).forEach((name) => setGate(name, null));
    updatePayloadPreview({ name: '', email: '', pwd: '', confirm: '' });
    status.textContent = 'Form reset. Awaiting new payload.';
    inputs.fullName.focus();
  });

  /* ------------------------------------------------------------------
   * Pipeline strip: lights up the stage the user is currently
   * interacting with, purely as an orientation cue.
   * ------------------------------------------------------------------ */
  function setActiveStage(stageName) {
    pipelineStages.forEach((el) => {
      el.classList.toggle('is-active', el.dataset.stage === stageName);
    });
  }
  inputs.fullName.addEventListener('focus', () => setActiveStage('structure'));
  inputs.email.addEventListener('focus', () => setActiveStage('structure'));
  inputs.password.addEventListener('focus', () => setActiveStage('scan'));
  inputs.confirmPassword.addEventListener('focus', () => setActiveStage('scan'));
  form.addEventListener('submit', () => setActiveStage('communicate'));

  // Initial state.
  evaluateGates();
})();
