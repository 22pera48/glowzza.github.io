// Importar Firebase SDK desde CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBDrfX2Fszw9-M1DwzX_Sk63et9tw4ddOU",
  authDomain: "glowzzainventario.firebaseapp.com",
  projectId: "glowzzainventario",
  storageBucket: "glowzzainventario.appspot.com",
  messagingSenderId: "159721581844",
  appId: "1:159721581844:web:f62cdb303258dc847b6601",
  measurementId: "G-0FR3Q6P3L2"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
  // -------------------- Carrito --------------------
  window.irAlCarrito = () => window.location.href = "carrito2.html";
  window.irAFavoritos = () => window.location.href = "favorito2.html";

  window.agregarAlCarrito = (nombre, precio) => {
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
  };

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

  window.finalizarCompra = () => window.location.href = "checkout.html";

  // -------------------- Wishlist --------------------
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-favorito")) {
      const card = e.target.closest(".producto");
      const nombre = card.querySelector("h4").textContent;
      const precio = card.querySelector("p").textContent.replace("$", "");
      const imagen = card.querySelector("img").src;

      let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];

      if (!favoritos.some(p => p.nombre === nombre)) {
        favoritos.push({ nombre, precio, imagen });
      }

      localStorage.setItem("favoritos", JSON.stringify(favoritos));

      Swal.fire({
        icon: 'info',
        title: 'Agregado a favoritos',
        text: nombre,
        timer: 1200,
        showConfirmButton: false
      });
    }
  });

  // -------------------- Dark Mode --------------------
  window.toggleDarkMode = () => document.body.classList.toggle("dark-mode");

  // -------------------- Carrusel automático --------------------
  let slideIndex = 0;
  let slides = document.querySelectorAll(".slides img");
  let autoPlay;

  if (slides.length > 0) {
    mostrarSlide(0);
    autoPlay = setInterval(() => moverSlide(1), 5000);

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

  function mostrarSlide(n) {
    slides.forEach((img, i) => {
      img.style.display = i === n ? "block" : "none";
      img.style.opacity = i === n ? "1" : "0";
    });
    document.querySelectorAll(".dot").forEach((dot, i) => {
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

  // -------------------- Buscador dinámico --------------------
  const buscador = document.getElementById("buscador");
  if (buscador) {
    buscador.addEventListener("input", () => {
      const filtro = buscador.value.toLowerCase();
      document.querySelectorAll(".producto").forEach(prod => {
        const nombre = prod.querySelector("h4").textContent.toLowerCase();
        prod.style.display = nombre.includes(filtro) ? "block" : "none";
      });
    });
  }

  // -------------------- Firebase: cargar productos dinámicamente --------------------
  const secciones = {
    peluqueria: document.querySelector("#peluqueria .productos"),
    skincare: document.querySelector("#skincare .productos"),
    maquillaje: document.querySelector("#maquillaje .productos"),
    "cuidado personal": document.querySelector("#cuidado-personal .productos"),
    "perfume y esencias": document.querySelector("#perfume-esencias .productos")
  };

  onSnapshot(collection(db, "productos_publicados_web"), (snapshot) => {
    Object.values(secciones).forEach(sec => sec.innerHTML = "");
    snapshot.forEach((doc) => {
      const producto = doc.data();
      const div = document.createElement("div");
      div.classList.add("producto");
      div.innerHTML = `
        <div class="img-wrapper">
          <img src="${producto.imagen}" alt="${producto.nombre}">
        </div>
        <h4>${producto.nombre}</h4>
        <p>$${producto.precio}</p>
        ${producto.descripcion ? `<p class="descripcion">${producto.descripcion}</p>` : ""}
        <button class="btn-secundario" onclick="eliminarFavorito('${producto.nombre}')">Eliminar</button>
        <button class="btn-principal" onclick="agregarAlCarrito('${producto.nombre}', ${producto.precio})">Agregar al carrito</button>
        <button class="btn-secundario btn-favorito">❤ Favorito</button>
      `;
      secciones[producto.categoria]?.appendChild(div);
    });
  });

  // -------------------- Modal para ampliar imagen --------------------
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImg");
  const caption = document.getElementById("caption");
  const closeBtn = document.querySelector(".close");

  document.addEventListener("click", (e) => {
    if (e.target.closest(".producto") && e.target.tagName === "IMG") {
      modal.style.display = "block";
      modalImg.src = e.target.src;
      caption.textContent = e.target.alt;
    }
  });

  if (closeBtn) {
    closeBtn.onclick = () => {
      modal.style.display = "none";
    };
  }
});
