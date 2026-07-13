// Marginalia — shared behaviour
// The mobile nav drawer runs entirely on the native Popover API (see the
// popover / popovertarget attributes in the HTML) and the shelf filters run
// on the native :has() selector in style.css — neither needs JavaScript.
// This file only powers the small "live breakpoint" ribbon used as a demo
// of the fact that the layout is genuinely fluid across widths.

(function () {
  const label = document.getElementById('bpLabel');
  if (!label) return;

  const queries = [
    { q: window.matchMedia('(min-width: 1024px)'), text: 'desktop · ≥1024px' },
    { q: window.matchMedia('(min-width: 768px)'), text: 'tablet · ≥768px' },
  ];

  function update() {
    const match = queries.find((item) => item.q.matches);
    label.textContent = match ? match.text : 'mobile · <768px';
  }

  queries.forEach((item) => item.q.addEventListener('change', update));
  update();
})();
