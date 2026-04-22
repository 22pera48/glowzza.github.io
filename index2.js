// -------------------- Carrito --------------------
function irAlCarrito() {
  window.location.href = "carrito.html";
}

function agregarAlCarrito(nombre, precio) {
  let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
  let item = carrito.find(p => p.nombre === nombre);
  if (item) {
    item.cantidad++;
  } else {
    carrito.push({ nombre, precio, cantidad: 1 });
  }
  localStorage.setItem("carrito", JSON.stringify(carrito));

  Swal.fire({
    position: 'top-end',
    icon: 'success',
    title: `${nombre} agregado al carrito`,
    showConfirmButton: false,
    timer: 1500
  });

  mostrarMiniCart();
}

function mostrarMiniCart() {
  let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
  const lista = document.getElementById("miniCartItems");
  if (!lista) return;
  lista.innerHTML = "";
  carrito.forEach(prod => {
    const li = document.createElement("li");
    li.textContent = `${prod.nombre} x${prod.cantidad} - $${prod.precio * prod.cantidad}`;
    lista.appendChild(li);
  });
}

function finalizarCompra() {
  window.location.href = "checkout.html";
}

// -------------------- Wishlist --------------------
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".btn-favorito").forEach(btn => {
    btn.addEventListener("click", () => {
      const producto = btn.closest(".producto").querySelector("h4").textContent;
      let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
      if (!favoritos.includes(producto)) favoritos.push(producto);
      localStorage.setItem("favoritos", JSON.stringify(favoritos));
      Swal.fire({
        icon: 'info',
        title: 'Agregado a favoritos',
        text: producto,
        timer: 1200,
        showConfirmButton: false
      });
    });
  });
});

// -------------------- Dark Mode --------------------
function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
}

// -------------------- Carrusel --------------------
let slideIndex = 0;
let slides;
let autoPlay;

document.addEventListener("DOMContentLoaded", () => {
  slides = document.querySelectorAll(".slides img");
  if (slides.length > 0) {
    mostrarSlide(slideIndex);
    autoPlay = setInterval(() => moverSlide(1), 5000);

    // Crear indicadores dinámicamente
    const indicadores = document.querySelector(".indicadores");
    slides.forEach((_, i) => {
      const dot = document.createElement("span");
      dot.classList.add("dot");
      dot.addEventListener("click", () => {
        slideIndex = i;
        mostrarSlide(slideIndex);
        resetAutoPlay();
      });
      indicadores.appendChild(dot);
    });
  }
});

function mostrarSlide(n) {
  slides.forEach((img, i) => {
    img.style.display = i === n ? "block" : "none";
    img.style.opacity = i === n ? "1" : "0";
  });

  const dots = document.querySelectorAll(".dot");
  dots.forEach((dot, i) => {
    dot.classList.toggle("active", i === n);
  });
}

function moverSlide(n) {
  slideIndex = (slideIndex + n + slides.length) % slides.length;
  mostrarSlide(slideIndex);
  resetAutoPlay();
}

function resetAutoPlay() {
  clearInterval(autoPlay);
  autoPlay = setInterval(() => moverSlide(1), 5000);
}
// Buscador dinámico
document.addEventListener("DOMContentLoaded", () => {
  const buscador = document.getElementById("buscador");
  buscador.addEventListener("input", () => {
    const filtro = buscador.value.toLowerCase();
    document.querySelectorAll(".producto").forEach(prod => {
      const nombre = prod.querySelector("h4").textContent.toLowerCase();
      prod.style.display = nombre.includes(filtro) ? "block" : "none";
    });
  });
});