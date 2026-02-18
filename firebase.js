import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  doc, 
  getDoc, 
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// Cargar catálogo de productos
async function cargarCatalogo() {
  const querySnapshot = await getDocs(collection(db, "productos"));
  catalogoProductos = [];
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
catalogoProductos.push({ 
  id: docSnap.id,
  orden: data.orden,
  nombre: data.nombre,
  precio: data.precio,
  color: data.color,
  categoria: data.categoria
});
  });
}

// Guardar cliente
document.getElementById("clienteForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombre = document.getElementById("nombre").value;
  const fecha = document.getElementById("fecha").value;

  const etiquetaUnica = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);

  await addDoc(collection(db, "clientes"), { 
    nombre, 
    fecha,
    ubicacion: "deposito",
    pago: "no",
    productos: [],
    etiqueta: etiquetaUnica
  });

  alert("Cliente guardado!");
  mostrarClientes();
});

// 🔹 Función unificada para eliminar producto
async function eliminarProducto(clienteId, productoId, item, headerDiv) {
  const clienteRef = doc(db, "clientes", clienteId);
  const clienteSnap = await getDoc(clienteRef);
  let productosActuales = clienteSnap.data().productos || [];

  productosActuales = productosActuales.filter(p => p.id !== productoId);

  await updateDoc(clienteRef, { productos: productosActuales });

  item.remove();

  let nuevoTotal = productosActuales.reduce((acc, prod) => acc + prod.precio * prod.cantidad, 0);
  headerDiv.textContent = `${clienteSnap.data().nombre} - ${clienteSnap.data().fecha} | Código: ${clienteSnap.data().etiqueta} | Total: $${nuevoTotal}`;
}

// Mostrar clientes
async function mostrarClientes() {
  await cargarCatalogo();
  const lista = document.getElementById("listaClientes");
  if (!lista) return;
  lista.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "clientes"));

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();

    let total = 0;
    if (data.productos && data.productos.length > 0) {
      data.productos.forEach(p => { total += p.precio * p.cantidad; });
    }

    const li = document.createElement("li");

    const headerDiv = document.createElement("div");
    headerDiv.style.fontWeight = "bold";
    headerDiv.textContent = `${data.nombre} - ${data.fecha} | Código: ${data.etiqueta} | Total: $${total}`;
    li.appendChild(headerDiv);

    // Menús de ubicación y pago
    const ubicacionSelect = document.createElement("select");
    ubicacionSelect.innerHTML = `
      <option value="deposito">En depósito</option>
      <option value="despachado">Despachado</option>
    `;
    ubicacionSelect.value = data.ubicacion || "deposito";
    ubicacionSelect.addEventListener("change", async () => {
      await updateDoc(doc(db, "clientes", docSnap.id), { ubicacion: ubicacionSelect.value });
    });
    li.appendChild(ubicacionSelect);

    const pagoSelect = document.createElement("select");
    pagoSelect.innerHTML = `
      <option value="Sin pagar">Sin pagar</option>
      <option value="Pagado">Pagado</option>
    `;
    pagoSelect.value = data.pago || "Sin pagar";
    pagoSelect.addEventListener("change", async () => {
      await updateDoc(doc(db, "clientes", docSnap.id), { pago: pagoSelect.value });
    });
    li.appendChild(pagoSelect);

    // Botón Terminar compra
    const terminarButton = document.createElement("button");
    terminarButton.textContent = "Terminar compra";
    terminarButton.style.marginLeft = "10px";
    terminarButton.addEventListener("click", async () => {
      const clienteRef = doc(db, "clientes", docSnap.id);
      const clienteSnap = await getDoc(clienteRef);
      const clienteData = clienteSnap.data();

      if (!clienteData.productos || clienteData.productos.length === 0) {
        alert("No se puede cerrar la compra: el cliente no tiene productos cargados.");
        return;
      }

      if (pagoSelect.value === "Pagado" && ubicacionSelect.value === "despachado") {
        let totalFinal = clienteData.productos.reduce((acc, p) => acc + p.precio * p.cantidad, 0);

        await addDoc(collection(db, "ventasCerradas"), {
          nombre: clienteData.nombre,
          fecha: clienteData.fecha,
          productos: clienteData.productos,
          total: totalFinal,
          pago: pagoSelect.value,
          ubicacion: ubicacionSelect.value,
          etiqueta: clienteData.etiqueta
        });

        await deleteDoc(clienteRef);

        alert("Compra cerrada y movida a lista de ventas cerradas!");
        mostrarClientes();
        mostrarVentasCerradas();
      } else {
        alert("Solo se puede cerrar la compra si está PAGADO y DESPACHADO.");
      }
    });
    li.appendChild(terminarButton);

// Botón "+"
const addButton = document.createElement("button");
addButton.textContent = "+";
li.appendChild(addButton);

// Campo de búsqueda
const buscadorInput = document.createElement("input");
buscadorInput.type = "text";
buscadorInput.placeholder = "Buscar producto por nombre o [orden]";
buscadorInput.style.display = "none";
li.appendChild(buscadorInput);

// Lista de resultados
const resultadosList = document.createElement("ul");
resultadosList.style.display = "none";
li.appendChild(resultadosList);

// Toggle al apretar "+"
addButton.addEventListener("click", () => {
  const visible = buscadorInput.style.display === "none";
  buscadorInput.style.display = visible ? "inline-block" : "none";
  resultadosList.style.display = visible ? "block" : "none";

  if (visible) {
    mostrarProductos(resultadosList, docSnap.id, headerDiv);
  }
});

// Función para mostrar todos los productos
function mostrarProductos(resultadosList, clienteId, headerDiv) {
  resultadosList.innerHTML = "";
  catalogoProductos.forEach(p => {
    const item = document.createElement("li");
    item.textContent = `[${p.orden}] ${p.nombre} - $${p.precio}`;
    item.addEventListener("click", () => {
      agregarProductoACliente(clienteId, p, 1, headerDiv, resultadosList);
    });
    resultadosList.appendChild(item);
  });
}

// Filtrar mientras escribís
buscadorInput.addEventListener("input", () => {
  const filtro = buscadorInput.value.toLowerCase();
  resultadosList.innerHTML = "";
  catalogoProductos.forEach(p => {
    const texto = `${p.orden} ${p.nombre} ${p.categoria}`.toLowerCase();
    if (texto.includes(filtro)) {
      const item = document.createElement("li");
      item.textContent = `[${p.orden}] ${p.nombre} - $${p.precio}`;
      item.addEventListener("click", () => {
        agregarProductoACliente(docSnap.id, p, 1, headerDiv, resultadosList);
      });
      resultadosList.appendChild(item);
    }
  });
});

    productosSelect.innerHTML = opciones;
    li.appendChild(productosSelect);

    const cantidadInput = document.createElement("input");
    cantidadInput.type = "number";
    cantidadInput.min = 1;
    cantidadInput.value = 1;
    cantidadInput.style.display = "none";
    li.appendChild(cantidadInput);

    const productosList = document.createElement("ul");
    productosList.style.marginTop = "5px";

    // Renderizar productos existentes
    (data.productos || []).forEach((p) => {
      const item = document.createElement("li");
      item.textContent = `Producto: ${p.nombre} (Cantidad: ${p.cantidad}) - $${p.precio}`;
      item.dataset.productoId = p.id;

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Eliminar";
      deleteButton.style.marginLeft = "10px";
      deleteButton.addEventListener("click", () => {
        eliminarProducto(docSnap.id, item.dataset.productoId, item, headerDiv);
      });

      item.appendChild(deleteButton);
      productosList.appendChild(item);
    });

    li.appendChild(productosList);

    // Toggle menú de productos
    addButton.addEventListener("click", () => {
      const visible = productosSelect.style.display === "none";
      productosSelect.style.display = visible ? "inline-block" : "none";
      cantidadInput.style.display = visible ? "inline-block" : "none";
    });

    // Guardar producto nuevo

    lista.appendChild(li);
  });
}
async function agregarProductoACliente(clienteId, producto, cantidad, headerDiv, resultadosList) {
  const clienteRef = doc(db, "clientes", clienteId);
  const clienteSnap = await getDoc(clienteRef);
  let productosActuales = clienteSnap.data().productos || [];

  const productoId = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);

  productosActuales.push({
    id: productoId,
    nombre: producto.nombre,
    precio: producto.precio,
    cantidad: cantidad
  });

  await updateDoc(clienteRef, { productos: productosActuales });

  const item = document.createElement("li");
  item.textContent = `Producto: ${producto.nombre} (Cantidad: ${cantidad}) - $${producto.precio}`;
  item.dataset.productoId = productoId;

  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Eliminar";
  deleteButton.style.marginLeft = "10px";
  deleteButton.addEventListener("click", () => {
    eliminarProducto(clienteId, item.dataset.productoId, item, headerDiv);
  });

  item.appendChild(deleteButton);

  const productosList = headerDiv.parentElement.querySelector("ul");
  productosList.appendChild(item);

  let nuevoTotal = productosActuales.reduce((acc, prod) => acc + prod.precio * prod.cantidad, 0);
  headerDiv.textContent = `${clienteSnap.data().nombre} - ${clienteSnap.data().fecha} | Código: ${clienteSnap.data().etiqueta} | Total: $${nuevoTotal}`;

  resultadosList.style.display = "none";
}
// Mostrar ventas cerradas
async function mostrarVentasCerradas() {
  const lista = document.getElementById("listaVentasCerradas");
  if (!lista) return;
  lista.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "ventasCerradas"));

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();

    const li = document.createElement("li");
    li.textContent = `${data.nombre} - ${data.fecha} | Código: ${data.etiqueta} | Total: $${data.total}`;

    const productosList = document.createElement("ul");
    (data.productos || []).forEach(p => {
      const item = document.createElement("li");
      item.textContent = `Producto: ${p.nombre} (Cantidad: ${p.cantidad}) - $${p.precio}`;
      productosList.appendChild(item);
    });

    li.appendChild(productosList);
    lista.appendChild(li);
  });
}

// Cargar listas al abrir
mostrarClientes();
mostrarVentasCerradas();