(() => {
  "use strict";
  const c = window.SITE_CONTENT;
  if (!c) return;
  const $ = (selector) => document.querySelector(selector);
  const set = (selector, value) => { $(selector).textContent = value; };
  const el = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };
  document.title = c.meta.title;
  $('meta[name="description"]').content = c.meta.description;
  set("#brand-label", c.ui.brand);
  set(".skip-link", c.ui.skip);
  set("#affiliation-line", `${c.profile.role} · ${c.profile.affiliation}`);
  set("#profile-name", c.profile.name);
  c.profile.bio.split(/\n\n+/).forEach(paragraph => {
    const paragraphNode = el("p");
    paragraph.split(/(\*\*.*?\*\*)/g).forEach(part => paragraphNode.append(part.startsWith("**") && part.endsWith("**") ? el("strong", "", part.slice(2, -2)) : document.createTextNode(part)));
    $("#profile-bio").append(paragraphNode);
  });
  set("#view-cv-link", c.ui.viewCV);
  set("#draft-note", c.profile.draftNote);
  set("#footer-label", c.ui.footer);
  set("#back-to-top", c.ui.backToTop + " ↑");
  c.navigation.forEach((item) => {
    const a = el("a", "nav-link", item.label);
    a.href = item.id === "publications"
      ? "publications.html"
      : item.id === "research"
      ? "research.html"
      : `#${item.id}`;
    $("#site-nav").append(a);
  });
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

  const safeURL = (value, allowLocal = false) => {
    if (!value || typeof value !== "string") return null;
    try {
      if (allowLocal && /^(assets\/)[a-zA-Z0-9_./-]+$/.test(value) && !value.includes("..")) return value;
      const url = new URL(value);
      return ["https:", "http:"].includes(url.protocol) ? url.href : null;
    } catch { return null; }
  };
  const resourceLink = (label, value) => {
    const href = safeURL(value);
    if (!href) return null;
    const a = el("a", "resource-link", label + " ↗");
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    return a;
  };
  (c.profile.links || []).forEach(link => {
    const a = resourceLink(link.label, link.url);
    if (a) { a.className = "text-link"; $(".hero-actions").append(a); }
  });
  const section = (id, title, intro) => {
    const node = el("section", "section record-section");
    node.id = id;
    node.setAttribute("aria-labelledby", id + "-title");
    const heading = el("div", "section-heading");
    const titleWrap = el("div", "");
    const h = el("h2", "", title);
    h.id = id + "-title";
    titleWrap.append(h);
    if (intro) titleWrap.append(el("p", "section-intro", intro));
    heading.append(titleWrap);
    node.append(heading);
    const body = el("div", "record-body");
    node.append(body);
    $("#academic-record").append(node);
    return body;
  };
  const emptyState = (body, title, detail) => {
    const box = el("div", "empty-state");
    box.append(el("p", "empty-title", title));
    if (detail) box.append(el("p", "", detail));
    body.append(box);
  };
  const timeline = section("timeline", "Academic Background", "");
  const list = el("ol", "timeline-list");
  c.timeline.forEach(item => {
    const row = el("li", "timeline-entry");
    row.append(el("p", "timeline-date", item.date), el("h3", "", item.title), el("p", "record-description", item.detail));
    list.append(row);
  });
  timeline.append(list);
  const cvURL = safeURL(c.cv.url, true);
  if (cvURL) {
  const cvLink = $("#view-cv-link");
  cvLink.href = cvURL;
  cvLink.removeAttribute("download");
  cvLink.target = "_blank";
  cvLink.rel = "noopener noreferrer";
  cvLink.title = "View CV · PDF (opens in a new tab)";
  }
  const contact = section("contact", c.ui.contactTitle, c.ui.contactIntro);
  const contactLinks = el("div", "contact-links");
  (c.contact.emails || [c.contact.email]).filter(Boolean).forEach(address => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) return;
    const email = el("a", "contact-email", address);
    email.href = "mailto:" + address;
    contactLinks.append(email);
  });
  c.contact.links.forEach(link => { const a = resourceLink(link.label, link.url); if (a) contactLinks.append(a); });
  if (contactLinks.childElementCount) contact.append(contactLinks);
  else contact.append(el("p", "contact-placeholder", c.ui.contactEmpty));

  const menu = $(".menu-toggle");
  const nav = $("#site-nav");
  const setMenu = (open) => {
    menu.setAttribute("aria-expanded", String(open));
    menu.replaceChildren(document.createTextNode(open ? c.ui.closeMenu + " " : c.ui.menu + " "), el("span", "", open ? "−" : "+"));
    menu.lastChild.setAttribute("aria-hidden", "true");
    nav.classList.toggle("is-open", open);
  };
  setMenu(false);
  menu.addEventListener("click", () => setMenu(menu.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.getAttribute("aria-expanded") === "true") {
      setMenu(false);
      menu.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".site-header")) setMenu(false);
    const anchor = event.target.closest('a[href^="#"]');
    if (anchor) {
      const target = document.getElementById(anchor.hash.slice(1));
      if (target) {
        event.preventDefault();
        if (location.hash !== anchor.hash) history.pushState(null, "", anchor.hash);
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
        target.scrollIntoView({ behavior: "instant", block: "start" });
      }
    }
  });
  window.matchMedia("(min-width: 781px)").addEventListener("change", () => setMenu(false));
  const sections = [...document.querySelectorAll("main section[id]")];
  const navLinks = [...nav.querySelectorAll("a")];
  let scheduled = false;
  const markSection = () => {
    scheduled = false;
    let active = "home";
    sections.forEach(node => { if (node.getBoundingClientRect().top <= 160) active = node.id; });
    if (window.scrollY > 0 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 5) active = "contact";
    navLinks.forEach(link => { if (link.hash === "#" + active) link.setAttribute("aria-current", "location"); else link.removeAttribute("aria-current"); });
  };
  window.addEventListener("scroll", () => { if (!scheduled) { scheduled = true; window.requestAnimationFrame(markSection); } }, { passive: true });
  markSection();
  // Deferred rendering can finish after the browser's initial fragment navigation.
  if (location.hash) {
    const target = document.getElementById(location.hash.slice(1));
    if (target) window.requestAnimationFrame(() => target.scrollIntoView({ behavior: "instant" }));
  }
})();
