import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBDrfX2Fszw9-M1DwzX_Sk63et9tw4ddOU",
  authDomain: "glowzzainventario.firebaseapp.com",
  projectId: "glowzzainventario",
  storageBucket: "glowzzainventario.firebasestorage.app",
  messagingSenderId: "159721581844",
  appId: "1:159721581844:web:f62cdb303258dc847b6601",
  measurementId: "G-0FR3Q6P3L2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Guardar cliente
document.getElementById("clienteForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombre = document.getElementById("nombre").value;
  const fecha = document.getElementById("fecha").value;

  await addDoc(collection(db, "clientes"), { 
    nombre, 
    fecha,
    ubicacion: "deposito", // valor inicial
    pago: "no"             // valor inicial
  });
  alert("Cliente guardado!");
  mostrarClientes();
});

// Mostrar clientes
async function mostrarClientes() {
  const lista = document.getElementById("listaClientes");
  if (!lista) return;
  lista.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "clientes"));
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const li = document.createElement("li");
    li.textContent = `${data.nombre} - ${data.fecha} `;

    // Menú Ubicación
    const ubicacionSelect = document.createElement("select");
    ubicacionSelect.innerHTML = `
      <option value="deposito">En depósito</option>
      <option value="despachado">Despachado</option>
    `;
    if (data.ubicacion) ubicacionSelect.value = data.ubicacion;

    ubicacionSelect.addEventListener("change", async () => {
      await updateDoc(doc(db, "clientes", docSnap.id), {
        ubicacion: ubicacionSelect.value
      });
    });
    li.appendChild(ubicacionSelect);

    // Menú Pago
    const pagoSelect = document.createElement("select");
    pagoSelect.innerHTML = `
      <option value="sin pagar">Sin Pagar</option>
      <option value="pagado">Pagado</option>
    `;
    if (data.pago) pagoSelect.value = data.pago;

    pagoSelect.addEventListener("change", async () => {
      await updateDoc(doc(db, "clientes", docSnap.id), {
        pago: pagoSelect.value
      });
    });
    li.appendChild(pagoSelect);

    lista.appendChild(li);
  });
}

// Cargar lista al abrir
mostrarClientes();