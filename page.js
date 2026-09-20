  (() => {
    const button = document.querySelector('.menu-toggle');
    const nav = document.querySelector('#site-nav');
    const setMenu = open => {
      button.setAttribute('aria-expanded', String(open));
      button.innerHTML = open ? 'Close <span aria-hidden="true">−</span>' : 'Menu <span aria-hidden="true">+</span>';
      nav.classList.toggle('is-open', open);
    };
    button.addEventListener('click', () => setMenu(button.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
    document.addEventListener('click', event => { if (!event.target.closest('.site-header')) setMenu(false); });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') { setMenu(false); button.focus(); }
    });
    window.matchMedia('(min-width: 781px)').addEventListener('change', () => setMenu(false));
  })();

(() => {
  "use strict";
  const c = window.SITE_CONTENT;
  const $ = selector => document.querySelector(selector);
  if (!c?.network || !$("#research-network")) return;
  const svg = (tag, attributes) => {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.entries(attributes || {}).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  };
  c.network.edges.forEach(([from, to]) => {
    const a = c.network.nodes.find(node => node.id === from);
    const b = c.network.nodes.find(node => node.id === to);
    if (a && b) $("#network-edges").append(svg("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y }));
  });
  c.network.nodes.forEach(node => {
    const group = svg("g", { class: "network-node" + (node.emphasis ? " is-emphasized" : "") });
    const text = svg("text", { x: node.x, y: node.y - (node.label.length - 1) * 13, "text-anchor": "middle", "dominant-baseline": "middle", "font-size": node.size });
    node.label.forEach((line, i) => {
      const span = svg("tspan", { x: node.x, dy: i ? 27 : 0 });
      span.textContent = line;
      text.append(span);
    });
    group.append(text);
    $("#network-nodes").append(group);
  });

})();

// Figure links remain usable as ordinary links when JavaScript is unavailable.
(() => {
  'use strict';
  const links = [...document.querySelectorAll('.topic-figure a, a.publication-figure')]
    .filter(link => link.querySelector('img'));
  if (!links.length || !window.HTMLDialogElement) return;

  const dialog = document.createElement('dialog');
  dialog.id = 'image-viewer';
  dialog.className = 'image-viewer';
  dialog.setAttribute('aria-labelledby', 'image-viewer-title');
  dialog.innerHTML = `
    <div class="image-viewer-toolbar">
      <h2 id="image-viewer-title">Figure preview</h2>
      <div class="image-viewer-controls">
        <button type="button" data-action="out" aria-label="Zoom out">−</button>
        <button type="button" data-action="in" aria-label="Zoom in">+</button>
        <button type="button" data-action="fit">Fit</button>
        <button type="button" data-action="close" autofocus>Close <span aria-hidden="true">×</span></button>
      </div>
    </div>
    <div class="image-viewer-stage" tabindex="0" role="region" aria-label="Figure. When zoomed in, scroll to view details.">
      <div class="image-viewer-canvas"><img class="image-viewer-image" alt="" hidden></div>
    </div>
    <div class="image-viewer-footer">
      <p class="image-viewer-caption"></p>
      <p class="image-viewer-status" role="status" aria-live="polite"></p>
      <a class="image-viewer-original" target="_blank" rel="noopener noreferrer">Open original ↗</a>
    </div>`;
  document.body.append(dialog);
  const stage = dialog.querySelector('.image-viewer-stage');
  const canvas = dialog.querySelector('.image-viewer-canvas');
  const picture = dialog.querySelector('.image-viewer-image');
  const caption = dialog.querySelector('.image-viewer-caption');
  const status = dialog.querySelector('.image-viewer-status');
  const original = dialog.querySelector('.image-viewer-original');
  const zoomIn = dialog.querySelector('[data-action="in"]');
  const zoomOut = dialog.querySelector('[data-action="out"]');
  const fit = dialog.querySelector('[data-action="fit"]');
  let zoom = 1;
  let opener;
  let previousOverflow = '';
  let ready = false;

  function render(resetScroll = false) {
    if (!dialog.open || !ready) return;
    const oldWidth = canvas.offsetWidth;
    const oldHeight = canvas.offsetHeight;
    const centerX = (stage.scrollLeft + stage.clientWidth / 2) / oldWidth;
    const centerY = (stage.scrollTop + stage.clientHeight / 2) / oldHeight;
    const fitScale = Math.min(
      Math.max(1, stage.clientWidth - 40) / picture.naturalWidth,
      Math.max(1, stage.clientHeight - 40) / picture.naturalHeight
    );
    const width = Math.max(1, Math.round(picture.naturalWidth * fitScale * zoom));
    const height = Math.max(1, Math.round(picture.naturalHeight * fitScale * zoom));
    picture.style.width = `${width}px`;
    picture.style.height = `${height}px`;
    canvas.style.width = `${Math.max(stage.clientWidth, width + 40)}px`;
    canvas.style.height = `${Math.max(stage.clientHeight, height + 40)}px`;
    picture.hidden = false;
    zoomOut.disabled = zoom <= 1;
    zoomIn.disabled = zoom >= 4;
    fit.disabled = false;
    status.textContent = zoom === 1 ? 'Fit to screen' : `${Math.round(zoom * 100)}% of fitted size · Scroll to explore`;
    stage.scrollLeft = resetScroll ? 0 : centerX * canvas.offsetWidth - stage.clientWidth / 2;
    stage.scrollTop = resetScroll ? 0 : centerY * canvas.offsetHeight - stage.clientHeight / 2;
  }

  function openFigure(link) {
    opener = link;
    const thumbnail = link.querySelector('img');
    const figureCaption = link.closest('figure')?.querySelector('figcaption');
    caption.textContent = figureCaption?.textContent || thumbnail.alt || 'Research figure';
    picture.alt = thumbnail.alt || 'Research figure';
    original.href = link.href;
    zoom = 1;
    ready = false;
    picture.hidden = true;
    canvas.style.width = '';
    canvas.style.height = '';
    status.textContent = 'Loading figure…';
    zoomIn.disabled = zoomOut.disabled = fit.disabled = true;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    picture.src = link.href;
  }

  picture.addEventListener('load', () => {
    ready = picture.naturalWidth > 0 && picture.naturalHeight > 0;
    render(true);
  });
  picture.addEventListener('error', () => {
    ready = false;
    status.textContent = 'This figure could not be loaded. Try opening the original.';
  });
  links.forEach(link => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.setAttribute('aria-controls', dialog.id);
    link.title = 'View figure';
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      openFigure(link);
    });
  });
  dialog.addEventListener('click', event => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'close') dialog.close();
    else if (action === 'in') { zoom = Math.min(4, zoom + 0.5); render(); }
    else if (action === 'out') { zoom = Math.max(1, zoom - 0.5); render(); }
    else if (action === 'fit') { zoom = 1; render(true); }
    else if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    }
  });
  dialog.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow;
    opener?.focus({ preventScroll: true });
  });
  window.addEventListener('resize', () => render(true));
})();
