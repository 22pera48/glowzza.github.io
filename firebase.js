import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

  await addDoc(collection(db, "clientes"), { nombre, fecha });
  alert("Cliente guardado!");
  mostrarClientes();
});

// Mostrar clientes
async function mostrarClientes() {
  const lista = document.getElementById("listaClientes");
  if (!lista) return; // seguridad por si no existe el UL
  lista.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "clientes"));
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const li = document.createElement("li");
    li.textContent = `${data.nombre} - ${data.fecha}`;
    lista.appendChild(li);
  });
}

// Cargar lista al abrir
mostrarClientes();