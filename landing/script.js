// Carrusel automático
let currentSlide = 0;
const slides = document.querySelectorAll(".slide");
const carousel = document.getElementById("carousel");

function showSlide(index) {
  const offset = -index * 320; // ancho imagen + gap
  carousel.style.transform = `translateX(${offset}px)`;
  carousel.style.transition = "transform 0.5s ease-in-out";
}

setInterval(() => {
  currentSlide = (currentSlide + 1) % slides.length;
  showSlide(currentSlide);
}, 3000);
