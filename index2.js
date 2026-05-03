// Importar Firebase SDK desde CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } 
    from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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
// 🔹 Inicializar Auth
const auth = getAuth(app);
document.addEventListener("DOMContentLoaded", () => {
  // -------------------- Carrito --------------------
  window.irAlCarrito = () => window.location.href = "carrito2.html";
  window.irAFavoritos = () => window.location.href = "favorito2.html";

  // ✅ guarda también la imagen
  window.agregarAlCarrito = (nombre, precio, imagen) => {
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    let item = carrito.find(p => p.nombre === nombre);
    if (item) {
      item.cantidad++;
    } else {
      carrito.push({ nombre, precio, cantidad: 1, imagen });
    }
    localStorage.setItem("carrito", JSON.stringify(carrito));

Swal.fire({
  position: 'center',
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
      li.innerHTML = `<img src="${prod.imagen}" alt="${prod.nombre}" style="width:30px;height:30px;margin-right:8px;"> ${prod.nombre} x${prod.cantidad} - $${prod.precio * prod.cantidad}`;
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
        <button class="btn-principal" onclick="agregarAlCarrito('${producto.nombre}', ${producto.precio}, '${producto.imagen}')">Agregar al carrito</button>
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
    // -------------------- Login con Firebase Auth --------------------

  // Botón de login (puede ser el que pusimos en el header)
  window.mostrarLogin = () => {
    Swal.fire({
      title: 'Iniciar Sesión',
      html:
        '<input id="swal-user" class="swal2-input" placeholder="Email">' +
        '<input id="swal-pass" type="password" class="swal2-input" placeholder="Contraseña">',
      confirmButtonText: 'Ingresar',
      focusConfirm: false,
      preConfirm: () => {
        const email = document.getElementById('swal-user').value;
        const pass = document.getElementById('swal-pass').value;
        if (!email || !pass) {
          Swal.showValidationMessage('Completa email y contraseña');
          return false;
        }
        return { email, pass };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await signInWithEmailAndPassword(auth, result.value.email, result.value.pass);
          Swal.fire('Bienvenido', 'Ingreso exitoso ✅', 'success');
          setTimeout(() => {
            window.location.href = "panel.html"; // redirige al panel
          }, 1500);
        } catch (error) {
          Swal.fire('Error', error.message, 'error');
        }
      }
    });
  };

  // Botón de logout (si lo agregás en el header)
  window.cerrarSesion = async () => {
    try {
      await signOut(auth);
      Swal.fire('Sesión cerrada', '', 'info');
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  // Control de sesión: mostrar/ocultar acceso al panel
onAuthStateChanged(auth, (user) => {
  const loginBtn = document.querySelector(".btn-login");
  const logoutBtn = document.querySelector(".btn-logout");

  if (user) {
    // Usuario logueado → ocultar login y mostrar logout
    if (loginBtn) loginBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "inline-block";
  } else {
    // Usuario no logueado → mostrar login y ocultar logout
    if (loginBtn) loginBtn.style.display = "inline-block";
    if (logoutBtn) logoutBtn.style.display = "none";
  }
});

});
