const sectionOrder = ["introducere", "centrul-istoric", "sectorul-1", "sectorul-2"];
let currentId = null;

const TRANSITION_MS = 320;
const hideTimers = new WeakMap();

async function waitForFonts() {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
  document.body.classList.add("fonts-ready");
}

async function fillTextColumns(el) {
  const src = el.getAttribute("data-src") || "text.txt";
  const wanted = (el.getAttribute("data-part") || "").toLowerCase().trim();

  const res = await fetch(src);
  const fullText = await res.text();

  const sections = {};
  const parts = fullText.split(/^\s*===\s*(.+?)\s*===\s*$/m);

  for (let i = 1; i < parts.length; i += 2) {
    const key = parts[i].toLowerCase().replace(/\s+/g, "-").trim();
    sections[key] = (parts[i + 1] || "").trim();
  }

  const chosenText = sections[wanted] || "";

  const paragraphs = chosenText
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  el.innerHTML = paragraphs
    .map((p, i) => `<p class="${i === 0 ? "three" : ""}">${p}</p>`)
    .join("");
}

function wireFooterArrows(activeId) {
  const index = sectionOrder.indexOf(activeId);

  document.querySelectorAll(".content-box").forEach((box) => {
    const prevBtn = box.querySelector(".nav-arrow.prev");
    const nextBtn = box.querySelector(".nav-arrow.next");
    if (!prevBtn || !nextBtn) return;

    prevBtn.disabled = index <= 0;
    nextBtn.disabled = index >= sectionOrder.length - 1;

    prevBtn.onclick = () => {
      if (index > 0) location.hash = "#" + sectionOrder[index - 1];
    };

    nextBtn.onclick = () => {
      if (index < sectionOrder.length - 1)
        location.hash = "#" + sectionOrder[index + 1];
    };
  });
}

function setActiveBoxFromHash() {
  const id = (window.location.hash || "#introducere").replace("#", "");
  const nextBox = document.getElementById(id);
  if (!nextBox) return;

  // reset scroll when switching sections
  window.scrollTo({ top: 0, behavior: "auto" });

  // sidenav highlight
  document.querySelectorAll(".sidenav a").forEach((a) => {
    a.classList.toggle("active", a.getAttribute("href") === "#" + id);
  });

  wireFooterArrows(id);

  // show only the active content box
  document.querySelectorAll(".content-box").forEach((box) => {
    box.classList.remove("is-active");
  });

  nextBox.classList.add("is-active");

  // restart animation cleanly
  nextBox.style.animation = "none";
  void nextBox.offsetHeight;
  nextBox.style.animation = "";
}

document.addEventListener("DOMContentLoaded", async () => {
  await waitForFonts();

  const blocks = document.querySelectorAll(".text-columns");
  await Promise.all([...blocks].map((el) => fillTextColumns(el)));

  // sidenav click: if you click the already-active section, just go to top
  document.querySelectorAll(".sidenav a").forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = a.getAttribute("href");
      const current = window.location.hash || "#introducere";

      if (target === current) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "auto" });
      }
      // otherwise: default behavior changes hash -> hashchange triggers setActiveBoxFromHash
    });
  });

  setActiveBoxFromHash();
  window.addEventListener("hashchange", setActiveBoxFromHash);
});
