const year = document.getElementById("year");
year.textContent = new Date().getFullYear();

const burger = document.getElementById("burger");
const navLinks = document.getElementById("navLinks");

burger.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  burger.setAttribute("aria-expanded", String(isOpen));
});

document.getElementById("resumeBtn").addEventListener("click", (e) => {
  e.preventDefault();
  alert("/Resume (Zamson).pdf");
});
