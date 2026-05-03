// promociones2.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// ⚠️ Configuración Firebase
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

// Contenedor de promociones
const promoContainer = document.getElementById("promoContainer");

// Función para cargar promociones
async function cargarPromociones() {
  try {
    promoContainer.innerHTML = "<p>Cargando promociones...</p>";

    const snapshot = await getDocs(collection(db, "promociones_publicadas_web"));
    promoContainer.innerHTML = "";

    snapshot.forEach(docSnap => {
      const promo = docSnap.data();
      if (!promo.activo) return; // solo mostrar activas

      const card = document.createElement("div");
      card.classList.add("promo-card");

      // contenido de la tarjeta con combo completo
card.innerHTML = `
  <h3>${promo.tituloPersonalizado || promo.titulo}</h3>
  <p>${promo.descripcion || ""}</p>
  <p class="precio">Antes: $${promo.precio_original}<br>Ahora: $${promo.precio_descuento}</p>
  <p><strong>Estado:</strong> ${promo.activo ? "✅ Activa" : "❌ Inactiva"}</p>
  ${promo.imagen ? `<img src="${promo.imagen}" alt="${promo.tituloPersonalizado || promo.titulo}" class="promo-img">` : ""}
  <div class="combo-grid">
    ${
      promo.comboProductos?.map(p => `
        <div class="combo-item">
          <img src="${p.imagen}" alt="${p.nombre}">
          <p>${p.nombre}</p>
        </div>
      `).join("") || ""
    }
  </div>
`;

      // botón con event listener
      const btn = document.createElement("button");
      btn.classList.add("btn-principal");
      btn.textContent = "Agregar al carrito";
      btn.addEventListener("click", () => agregarAlCarrito(promo));

      card.appendChild(btn);
      promoContainer.appendChild(card);
    });
  } catch (error) {
    console.error("Error al cargar promociones:", error);
    promoContainer.innerHTML = "<p>❌ Error al cargar promociones</p>";
  }
}

// Función para manejar el carrito
function agregarAlCarrito(promo) {
  try {
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

    // 🔹 Calcular el total del combo
    const totalCombo = promo.comboProductos?.reduce(
      (acc, prod) => acc + Number(prod.precio),
      0
    ) || 0;

    // 🔹 Usar precio con descuento si existe, sino el total
    const precioFinal = promo.precio_descuento
      ? Number(promo.precio_descuento)
      : totalCombo;

    // 🔹 Crear entrada única para el combo
    carrito.push({
      id: promo.id,
      nombre: promo.tituloPersonalizado || promo.titulo || "Combo",
      precio: precioFinal,
      descripcion: promo.descripcion || "",
      imagen: promo.imagen,
      productos: promo.comboProductos, // opcional: detalle de productos
      cantidad: 1
    });

    localStorage.setItem("carrito", JSON.stringify(carrito));
    alert(`✅ "${promo.titulo}" agregado al carrito`);
  } catch (error) {
    console.error("Error al agregar al carrito:", error);
  }
}

// Ejecutar carga al iniciar
cargarPromociones();
