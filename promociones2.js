// promociones2.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// ⚠️ Pegá acá tu configuración de Firebase
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID",
  measurementId: "TU_MEASUREMENT_ID"
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

    snapshot.forEach(doc => {
      const promo = doc.data();
      if (!promo.activo) return; // solo mostrar activas

      const card = document.createElement("div");
      card.classList.add("promo-card");

      card.innerHTML = `
        <img src="${promo.imagen}" alt="${promo.titulo}">
        <h3>${promo.titulo}</h3>
        <p>${promo.descripcion}</p>
        <p class="precio">Antes: $${promo.precio_original}<br>Ahora: $${promo.precio_descuento}</p>
        <button class="btn-principal" onclick="agregarAlCarrito('${promo.titulo}', ${promo.precio_descuento})">
          Agregar al carrito
        </button>
      `;

      promoContainer.appendChild(card);
    });
  } catch (error) {
    console.error("Error al cargar promociones:", error);
    promoContainer.innerHTML = "<p>❌ Error al cargar promociones</p>";
  }
}

// Ejecutar carga al iniciar
cargarPromociones();
