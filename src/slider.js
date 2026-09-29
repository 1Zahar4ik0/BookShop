export function initSlider(root) {
  const slides = [...root.querySelectorAll(".slide")];
  const dots = [...root.querySelectorAll(".slider-dot")];
  let current = 0;
  let timer;

  function show(index) {
    current = index;
    slides.forEach((slide, i) => {
      slide.classList.toggle("is-active", i === index);
      slide.setAttribute("aria-hidden", String(i !== index));
      slide.querySelector("a").tabIndex = i === index ? 0 : -1;
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle("is-active", i === index);
      if (i === index) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
  }

  function start() {
    clearInterval(timer);
    timer = setInterval(() => show((current + 1) % slides.length), 5000);
  }

  dots.forEach((dot, index) =>
    dot.addEventListener("click", () => {
      show(index);
      start();
    }),
  );
  show(0);
  start();
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearInterval(timer);
    else start();
  });
}
