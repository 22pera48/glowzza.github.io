import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, getDoc } 
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

let catalogoProductos = [];

// Cargar catálogo de productos (nombre + precio)
async function cargarCatalogo() {
  const querySnapshot = await getDocs(collection(db, "productos"));
  catalogoProductos = [];
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    catalogoProductos.push({ nombre: data.nombre, precio: data.precio });
  });
}

// Guardar cliente
document.getElementById("clienteForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombre = document.getElementById("nombre").value;
  const fecha = document.getElementById("fecha").value;

  await addDoc(collection(db, "clientes"), { 
    nombre, 
    fecha,
    ubicacion: "deposito", // valor inicial
    pago: "no",            // valor inicial
    productos: []          // lista vacía de productos
  });
  alert("Cliente guardado!");
  mostrarClientes();
});

// Mostrar clientes
async function mostrarClientes() {
  await cargarCatalogo(); // primero cargamos el catálogo

  const lista = document.getElementById("listaClientes");
  if (!lista) return;
  lista.innerHTML = "";

// ESTA LÍNEA ES LA QUE FALTABA
  const querySnapshot = await getDocs(collection(db, "clientes"));

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();

    // Calcular el total de productos
    let total = 0;
    if (data.productos && data.productos.length > 0) {
      data.productos.forEach(p => {
        total += p.precio * p.cantidad;
      });
    }

    // Crear contenedor principal
    const li = document.createElement("li");

    // Encabezado con nombre, fecha y total
    const headerDiv = document.createElement("div");
    headerDiv.style.fontWeight = "bold";
    headerDiv.textContent = `${data.nombre} - ${data.fecha} | Total: $${total}`;
    li.appendChild(headerDiv);


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
      <option value="no">Sin pagar</option>
      <option value="si">Pagado</option>
    `;
    if (data.pago) pagoSelect.value = data.pago;

    pagoSelect.addEventListener("change", async () => {
      await updateDoc(doc(db, "clientes", docSnap.id), {
        pago: pagoSelect.value
      });
    });
    li.appendChild(pagoSelect);

    // Botón "+"
    const addButton = document.createElement("button");
    addButton.textContent = "+";
    li.appendChild(addButton);

    // Menú de productos (oculto al inicio)
    const productosSelect = document.createElement("select");
    productosSelect.style.display = "none";

    let opciones = `<option value="">Seleccionar producto...</option>`;
    catalogoProductos.forEach(p => {
      opciones += `<option value="${p.nombre}">${p.nombre} - $${p.precio}</option>`;
    });
    productosSelect.innerHTML = opciones;
    li.appendChild(productosSelect);

    // Campo cantidad (oculto al inicio)
    const cantidadInput = document.createElement("input");
    cantidadInput.type = "number";
    cantidadInput.min = 1;
    cantidadInput.value = 1;
    cantidadInput.style.display = "none";
    li.appendChild(cantidadInput);

    // Contenedor para mostrar productos listados
    const productosList = document.createElement("ul");
    productosList.style.marginTop = "5px";
    if (data.productos && data.productos.length > 0) {
      data.productos.forEach(p => {
        const item = document.createElement("li");
        item.textContent = `Producto: ${p.nombre} (Cantidad: ${p.cantidad}) - $${p.precio}`;
        productosList.appendChild(item);
      });
    }
    li.appendChild(productosList);

    // Mostrar menú y cantidad al presionar "+"
    addButton.addEventListener("click", () => {
      productosSelect.style.display = "inline-block";
      cantidadInput.style.display = "inline-block";
    });

    // Guardar producto con cantidad y precio en Firestore
    productosSelect.addEventListener("change", async () => {
      const nombreProducto = productosSelect.value;
      const cantidad = parseInt(cantidadInput.value, 10);
      if (!nombreProducto) return;

      const productoInfo = catalogoProductos.find(p => p.nombre === nombreProducto);
      const precio = productoInfo ? productoInfo.precio : 0;

      const clienteRef = doc(db, "clientes", docSnap.id);
      const clienteSnap = await getDoc(clienteRef);
      let productosActuales = clienteSnap.data().productos || [];

      productosActuales.push({ nombre: nombreProducto, precio, cantidad });

      await updateDoc(clienteRef, { productos: productosActuales });

      const item = document.createElement("li");
      item.textContent = `Producto: ${nombreProducto} (Cantidad: ${cantidad}) - $${precio}`;
      productosList.appendChild(item);

      productosSelect.style.display = "none";
      cantidadInput.style.display = "none";
    });

    lista.appendChild(li);
  });
}

// Cargar lista al abrir
mostrarClientes();