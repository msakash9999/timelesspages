function getStoredUserName() {
  const persistence = window.TimelessPagesUserPersistence;
  if (persistence) {
    const session = persistence.getSessionSnapshot();
    return (session.userName || '').trim();
  }

  const userName = localStorage.getItem('timelessPagesUserName');
  return userName ? userName.trim() : '';
}

// Session management is now handled globally by catalog.js
// This script handles home-specific animation and logic.

function initHome() {
  console.log("Home init");
  initHomeAnimations();
}

function initHomeAnimations() {
  const Motion = window.Motion;
  if (!Motion) {
    console.warn("Motion library not loaded, animations disabled.");
    return;
  }

  const { animate, inView } = Motion;

  // 1. HERO SECTION ENTRANCE ANIMATIONS
  // Animate hero title sliding up and fading in
  if (document.querySelector(".hero h1")) {
    animate(".hero h1", { opacity: [0, 1], y: [45, 0] }, { duration: 1, easing: [0.16, 1, 0.3, 1] });
  }

  // Animate hero paragraph
  if (document.querySelector(".hero p")) {
    animate(".hero p", { opacity: [0, 1], y: [25, 0] }, { duration: 0.8, delay: 0.25, easing: "ease-out" });
  }

  // Animate hero book cover (fade in, scale, and subtle rotate)
  if (document.querySelector(".hero-book")) {
    animate(".hero-book", { opacity: [0, 1], scale: [0.88, 1], rotate: [-8, 0] }, { duration: 1.1, delay: 0.45, easing: "ease-out" });
  }

  // Spin hero star badge infinitely
  if (document.querySelector(".star-badge")) {
    animate(".star-badge", { rotate: 360 }, { duration: 12, repeat: Infinity, easing: "linear" });
  }

  // 2. SCROLL TRIGGERED VIEWPORT ANIMATIONS
  // Section Headings
  inView(".section-head", ({ target }) => {
    animate(target, { opacity: [0, 1], y: [25, 0] }, { duration: 0.75, easing: "ease-out" });
  });

  // Individual Book Tiles (animate on scroll)
  inView(".book-tile", ({ target }) => {
    animate(target, { opacity: [0, 1], y: [35, 0] }, { duration: 0.6, easing: [0.25, 0.1, 0.25, 1] });
  });

  // Feature Split Grid columns
  inView(".feature-split", ({ target }) => {
    const textCol = target.querySelector("div:first-child");
    const imgCol = target.querySelector(".feature-bubble");
    if (textCol) animate(textCol, { opacity: [0, 1], x: [-35, 0] }, { duration: 0.8, easing: "ease-out" });
    if (imgCol) animate(imgCol, { opacity: [0, 1], x: [35, 0] }, { duration: 0.8, easing: "ease-out" });
  });

  // Promo split banner
  inView(".promo", ({ target }) => {
    const img = target.querySelector("img");
    const copy = target.querySelector(".promo-copy");
    const star = target.querySelector(".promo-star");
    if (img) animate(img, { opacity: [0, 1], scale: [0.93, 1] }, { duration: 0.9, easing: "ease-out" });
    if (copy) animate(copy, { opacity: [0, 1], y: [25, 0] }, { duration: 0.75, delay: 0.15, easing: "ease-out" });
    if (star) animate(star, { rotate: 360 }, { duration: 8, repeat: Infinity, easing: "linear" });
  });
}

document.addEventListener('DOMContentLoaded', initHome);
