// AZEEZ FOODS — shared site behaviour: nav, mobile menu, reveals, hero canvas + scroll-scrub

document.addEventListener("DOMContentLoaded", () => {
  const nav = document.querySelector(".nav");
  const burger = document.querySelector(".nav-burger");
  const mobileMenu = document.querySelector(".mobile-menu");

  const onScroll = () => {
    if (window.scrollY > 40) nav?.classList.add("scrolled");
    else nav?.classList.remove("scrolled");
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  burger?.addEventListener("click", () => {
    burger.classList.toggle("open");
    mobileMenu.classList.toggle("open");
  });
  mobileMenu?.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      burger.classList.remove("open");
      mobileMenu.classList.remove("open");
    })
  );

  // Active nav link
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a, .mobile-menu a").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === path || (path === "" && href === "index.html")) a.classList.add("active");
  });

  // ---- GSAP reveals (guarded, works even if GSAP fails to load) ----
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray(".reveal").forEach((el) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 1.1,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    });

    gsap.utils.toArray(".reveal-stagger").forEach((group) => {
      const items = group.children;
      gsap.to(items, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: { trigger: group, start: "top 88%", once: true },
      });
      gsap.set(items, { opacity: 0, y: 30 });
    });
  } else {
    document.querySelectorAll(".reveal, .reveal-stagger *").forEach((el) => {
      el.style.opacity = 1;
      el.style.transform = "none";
    });
  }

  initHero();
});

/* ==========================================================
   HERO — pinned scroll-scrub.
   If assets/video/hero.mp4 exists, it drives currentTime off
   scroll. Until that file is dropped in, a canvas particle
   fall (falling grain into a glowing bowl) fills the stage so
   the hero is never a dead frame. Swap-in is automatic: the
   video element's own onerror/canplay decide which one shows.
   ========================================================== */
function initHero() {
  const stage = document.querySelector(".hero-stage");
  if (!stage) return;

  const canvas = document.getElementById("heroCanvas");
  const video = document.querySelector(".hero-video");
  const pin = document.querySelector(".hero-pin");

  let videoReady = false;

  if (video) {
    video.addEventListener("loadedmetadata", () => {
      videoReady = true;
      video.classList.add("ready");
      if (canvas) canvas.style.opacity = "0";
    });
    video.addEventListener("error", () => {
      videoReady = false;
    });
  }

  // ---- canvas placeholder: falling grain, gathers density with scroll progress ----
  let ctx, w, h, dpr;
  const particles = [];
  const N = 140;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = stage.clientWidth;
    h = stage.clientHeight;
    if (!canvas) return;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  if (canvas) {
    ctx = canvas.getContext("2d");
    for (let i = 0; i < N; i++) {
      particles.push({
        x: Math.random(),
        y: Math.random() * -1,
        speed: 0.15 + Math.random() * 0.35,
        size: 1 + Math.random() * 2.2,
        drift: (Math.random() - 0.5) * 0.15,
        alpha: 0.3 + Math.random() * 0.6,
      });
    }
    resize();
    window.addEventListener("resize", resize);
  }

  let progress = 0; // 0..1 across the pin

  function draw() {
    if (!ctx) return requestAnimationFrame(draw);
    ctx.clearRect(0, 0, w, h);

    // vertical light shaft
    const shaftX = w * 0.5;
    const shaftGrad = ctx.createLinearGradient(0, 0, w, 0);
    shaftGrad.addColorStop(0, "rgba(247,212,104,0)");
    shaftGrad.addColorStop(0.5, `rgba(247,212,104,${0.05 + progress * 0.07})`);
    shaftGrad.addColorStop(1, "rgba(247,212,104,0)");
    ctx.fillStyle = shaftGrad;
    ctx.fillRect(shaftX - w * 0.18, 0, w * 0.36, h);

    // bowl glow that builds as progress increases
    const bowlY = h * 0.82;
    const glowR = h * (0.12 + progress * 0.22);
    const glow = ctx.createRadialGradient(shaftX, bowlY, 0, shaftX, bowlY, glowR);
    glow.addColorStop(0, `rgba(247,212,104,${0.18 * progress})`);
    glow.addColorStop(1, "rgba(247,212,104,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    const speedMul = 0.5 + progress * 1.4;
    const density = 0.35 + progress * 0.9;

    particles.forEach((p, i) => {
      if (i / N > density) return;
      p.y += (p.speed * speedMul) / 100;
      p.x += p.drift / 400;
      if (p.y > 0.86 + progress * 0.02) {
        p.y = Math.random() * -0.3;
        p.x = 0.5 + (Math.random() - 0.5) * (0.06 + progress * 0.22);
      }
      const px = p.x * w;
      const py = p.y * h;
      const grd = ctx.createLinearGradient(px, py - 6, px, py + 6);
      grd.addColorStop(0, `rgba(253,232,144,${p.alpha})`);
      grd.addColorStop(1, `rgba(180,125,43,${p.alpha * 0.6})`);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.ellipse(px, py, p.size, p.size * 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }
  if (canvas) requestAnimationFrame(draw);

  // ---- GSAP pin + scrub for text stages, and video/canvas progress ----
  if (window.gsap && window.ScrollTrigger && pin) {
    gsap.registerPlugin(ScrollTrigger);

    const word = document.querySelector(".hero-word");
    const line = document.querySelector(".hero-line");
    const tagline = document.querySelector(".hero-tagline");
    const cta = document.querySelector(".hero-cta");

    ScrollTrigger.create({
      trigger: pin,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        progress = self.progress;
        if (videoReady && video && video.duration) {
          video.currentTime = self.progress * video.duration;
        }
      },
    });

    const tl = gsap.timeline({
      scrollTrigger: { trigger: pin, start: "top top", end: "bottom bottom", scrub: true },
    });
    tl.to(word, { opacity: 1, duration: 0.12 }, 0.02)
      .to(word, { opacity: 0.35, duration: 0.08 }, 0.22)
      .to(line, { opacity: 1, duration: 0.1 }, 0.16)
      .to(line, { opacity: 0, duration: 0.08 }, 0.36)
      .to(tagline, { opacity: 1, y: 0, duration: 0.14 }, 0.62)
      .to(cta, { opacity: 1, duration: 0.1 }, 0.82);
  } else {
    // No GSAP: just show the final state so nothing is invisible.
    document.querySelector(".hero-word")?.style.setProperty("opacity", "1");
    document.querySelector(".hero-tagline")?.style.setProperty("opacity", "1");
    document.querySelector(".hero-cta")?.style.setProperty("opacity", "1");
  }
}
