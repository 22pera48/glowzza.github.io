// 🔹 Imports de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, addDoc, getDocs, collection, updateDoc,getDoc, deleteDoc, doc, query, where, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// 🔹 Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBDrfX2Fszw9-M1DwzX_Sk63et9tw4ddOU",
  authDomain: "glowzzainventario.firebaseapp.com",
  projectId: "glowzzainventario",
  storageBucket: "glowzzainventario.appspot.com",   // 🔹 corregido
  messagingSenderId: "159721581844",
  appId: "1:159721581844:web:f62cdb303258dc847b6601",
  measurementId: "G-0FR3Q6P3L2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
export { db, auth, addDoc, getDocs, collection, updateDoc, getDoc, deleteDoc, doc, query, where, increment };
let catalogoProductos = [];
// 🔹 Valida usuario y contraseña contra la colección "cajaCredenciales"
async function validarCredencialesCaja(usuario, password) {
  const snapshot = await getDocs(collection(db, "cajaCredenciales"));
  let valido = false;
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (data.usuario === usuario && data.password === password) {
      valido = true;
    }
  });
  return valido;
}


// 🔹 Referencias a elementos del DOM
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const menuLink = document.getElementById("menu-link");

// 🔹 Login
if (loginBtn && emailInput && passwordInput) {
  loginBtn.addEventListener("click", async () => {
    try {
      await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
      const msg = document.getElementById("loginMsg");
      if (msg) {
        msg.style.color = "green";
        msg.innerText = "Ingreso exitoso ✅";
      }
    } catch (error) {
      const msg = document.getElementById("loginMsg");
      if (msg) {
        msg.style.color = "red";
        msg.innerText = "Error: " + error.message;
      }
    }
  });
}

// 🔹 Logout
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    const msg = document.getElementById("loginMsg");
    if (msg) {
      msg.style.color = "blue";
      msg.innerText = "Sesión cerrada";
    }
  });
}

// 🔹 Control de sesión
onAuthStateChanged(auth, (user) => {
  if (menuLink) {
    menuLink.style.display = user ? "inline" : "none";
  }
});

// 🔹 Cargar catálogo de productos
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
      categoria: data.categoria,
      stock: data.stock
    });
  });

  // 🔹 Refrescar listado general en el DOM
  const listado = document.getElementById("listadoGeneral");
  if (listado) {
    listado.innerHTML = "";
    catalogoProductos.forEach(p => {
      const card = document.createElement("div");
      card.className = "producto-card";
      card.innerHTML = `
        <h3>[${p.orden}] ${p.nombre}</h3>
        <p><strong>Precio:</strong> $${p.precio}</p>
        <p><strong>Stock:</strong> ${p.stock}</p>
        <p><strong>ID:</strong> ${p.id}</p>
      `;
      listado.appendChild(card);
    });
  }
}
// 🔹 Procesar productos desde TXT (reforma para sumar stock correctamente)
async function cargarProductoDesdeTXT(nombre, precio, cantidad, orden, color, categoria, fecha) {
  // Normalizamos el nombre para evitar duplicados por espacios o mayúsculas
  const nombreNormalizado = nombre.trim();

const productoRef = doc(db, "productos", p.id);
  const productoSnap = await getDoc(productoRef);

  if (productoSnap.exists()) {
    // 🔹 Si existe, sumamos stock en vez de pisar
    await updateDoc(productoRef, {
      stock: increment(cantidad),
      precio: precio,
      color: color,
      categoria: categoria,
      fecha: fecha
    });
  } else {
    // 🔹 Si no existe, lo creamos con stock inicial
    await setDoc(productoRef, {
      nombre: nombreNormalizado,
      precio: precio,
      stock: cantidad,
      orden: orden,
      color: color,
      categoria: categoria,
      fecha: fecha
    });
  }
}
// 🔹 Guardar cliente
const clienteForm = document.getElementById("clienteForm");
if (clienteForm) {
  clienteForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const fecha = document.getElementById("fecha").value;
    const telefono = document.getElementById("telefono").value.trim();
    const nemonico = document.getElementById("nemonico").value.trim();

    // 🔹 Validar teléfono (solo números, entre 8 y 15 dígitos)
    const regex = /^[0-9]{8,15}$/;
    if (!regex.test(telefono)) {
      alert("El número de teléfono debe tener entre 8 y 15 dígitos y solo números.");
      return; // corta el registro si no cumple
    }

    const etiquetaUnica = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);

    await addDoc(collection(db, "clientes"), {
      nombre,
      telefono,
      nemonico,
      fecha,
      ubicacion: "deposito",
      pago: "no",
      productos: [],
      etiqueta: etiquetaUnica
    });

    const msg = document.getElementById("statusMsg");
    if (msg) {
      msg.style.color = "green";
      msg.innerText = "Cliente guardado!";
    }
    mostrarClientes();
  });
}
// 🔹 Eliminar producto del cliente (no toca stock global)
async function eliminarProducto(clienteId, productoId, item, headerDiv) {
  const clienteRef = doc(db, "clientes", clienteId);
  const clienteSnap = await getDoc(clienteRef);
  let productosActuales = clienteSnap.data().productos || [];

  productosActuales = productosActuales.filter(p => p.id !== productoId);

  await updateDoc(clienteRef, { productos: productosActuales });

  item.remove();

  let nuevoTotal = productosActuales.reduce((acc, prod) => acc + prod.precio * prod.cantidad, 0);
  headerDiv.textContent = `[${clienteSnap.data().nemonico || ""}] ${clienteSnap.data().nombre} - Tel: ${clienteSnap.data().telefono || "N/A"} - ${clienteSnap.data().fecha} | Código: ${clienteSnap.id} | Total: $${nuevoTotal}`;
}








// 🔹 Mostrar clientes
async function mostrarClientes() {
  await cargarCatalogo();
  const lista = document.getElementById("listaClientes");
  if (!lista) return;
  lista.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "clientes"));

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();

    const li = document.createElement("li");

    // Encabezado con totales
    const headerDiv = document.createElement("div");
    headerDiv.style.fontWeight = "bold";
    let totalCompra = (data.productos || []).reduce((acc, p) => acc + p.precio * p.cantidad, 0);
    let cuotas = data.cuotas || [null, null, null, null, null, null];
    let totalPagado = cuotas.reduce((acc, val) => acc + (val?.monto || 0), 0);
    let saldoPendiente = totalCompra - totalPagado;

    headerDiv.textContent = `[${data.nemonico || ""}] ${data.nombre} - Tel: ${data.telefono || "N/A"} - ${data.fecha} | Código: ${docSnap.id} | Total: $${totalCompra} | Pagado: $${totalPagado} | Pendiente: $${saldoPendiente}`;
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
  if (pagoSelect.value === "Pagado") {
    const usuario = prompt("Usuario de caja:");
    const password = prompt("Contraseña de caja:");

    const autorizado = await validarCredencialesCaja(usuario, password);
    if (autorizado) {
      await updateDoc(doc(db, "clientes", docSnap.id), { pago: "Pagado" });
    } else {
      alert("Credenciales inválidas. No se puede marcar como Pagado.");
      pagoSelect.value = "Sin pagar"; // vuelve al estado anterior
    }
  } else {
    await updateDoc(doc(db, "clientes", docSnap.id), { pago: pagoSelect.value });
  }
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
    const msg = document.getElementById("statusMsg");
    if (msg) {
      msg.style.color = "red";
      msg.innerText = "No se puede cerrar la compra: el cliente no tiene productos cargados.";
    }
    return;
  }

  if (pagoSelect.value === "Pagado" && ubicacionSelect.value === "despachado") {
    let totalFinal = clienteData.productos.reduce((acc, p) => acc + p.precio * p.cantidad, 0);

    // 🔹 Paso 1: validar stock de todos los productos
    for (const p of clienteData.productos) {
      const productoRef = doc(db, "productos", p.id);
      const productoSnap = await getDoc(productoRef);
      if (productoSnap.exists()) {
        const stockActual = productoSnap.data().stock || 0;
        if (stockActual < p.cantidad) {
          alert(`No hay stock suficiente para ${p.nombre}. Stock actual: ${stockActual}, cantidad pedida: ${p.cantidad}`);
          const msg = document.getElementById("statusMsg");
          if (msg) {
            msg.style.color = "red";
            msg.innerText = `No hay stock suficiente para ${p.nombre}. Stock actual: ${stockActual}, cantidad pedida: ${p.cantidad}`;
          }
          return; // 🚫 cortar aquí, sin descontar nada
        }
      }
    }

    // 🔹 Paso 2: descontar stock solo si todo está OK
    for (const p of clienteData.productos) {
      const productoRef = doc(db, "productos", p.id);
      await updateDoc(productoRef, { stock: increment(-p.cantidad) });
    }

    // 🔹 Paso 3: guardar venta cerrada
    await addDoc(collection(db, "ventasCerradas"), {
      nombre: clienteData.nombre,
      telefono: clienteData.telefono,
      nemonico: clienteData.nemonico,
      fecha: clienteData.fecha,
      fechaCierre: new Date().toISOString(),
      productos: clienteData.productos,
      total: totalFinal,
      pago: pagoSelect.value,
      ubicacion: ubicacionSelect.value,
      etiqueta: clienteData.etiqueta
    });

    await deleteDoc(clienteRef);

    const msg = document.getElementById("statusMsg");
    if (msg) {
      msg.style.color = "green";
      msg.innerText = "Compra cerrada y movida a lista de ventas cerradas!";
    }

    mostrarClientes();
    mostrarVentasCerradas();
  } else {
    const msg = document.getElementById("statusMsg");
    if (msg) {
      msg.style.color = "red";
      msg.innerText = "Solo se puede cerrar la compra si está PAGADO y DESPACHADO.";
    }
  }
});
li.appendChild(terminarButton);








    // Botón cuotas
    const cuotaBtn = document.createElement("button");
    cuotaBtn.textContent = "Cuotas";
    cuotaBtn.style.marginLeft = "10px";
    li.appendChild(cuotaBtn);

    const cuotasContainer = document.createElement("div");
    cuotasContainer.style.display = "none";
    cuotasContainer.style.marginTop = "10px";
    cuotasContainer.style.flexDirection = "column";
    li.appendChild(cuotasContainer);

    let cuotaSeleccionada = null;
    cuotaBtn.addEventListener("click", () => {
      cuotasContainer.style.display = cuotasContainer.style.display === "none" ? "flex" : "none";
      renderCuotas();
    });

    function renderCuotas() {
      cuotasContainer.innerHTML = "";
      cuotas.forEach((valor, i) => {
        const div = document.createElement("div");
        div.style.border = "1px solid #ccc";
        div.style.background = valor ? "#d4edda" : "#fff";
        div.style.padding = "10px";
        div.style.margin = "5px 0";
        div.style.width = "250px";
        div.style.cursor = "pointer";
        div.textContent = valor ? `${i+1}. $${valor.monto} – Fecha: ${new Date(valor.fecha).toLocaleDateString()}` : `${i+1}.`;

        if (valor) {
          const deleteBtn = document.createElement("button");
          deleteBtn.textContent = "Eliminar";
          deleteBtn.style.marginLeft = "10px";
          deleteBtn.onclick = async () => {
            cuotas[i] = null;
            await updateDoc(doc(db, "clientes", docSnap.id), { cuotas });
            mostrarClientes();
          };
          div.appendChild(deleteBtn);
        }

        div.onclick = () => cuotaSeleccionada = i;
        cuotasContainer.appendChild(div);
      });

      const input = document.createElement("input");
      input.type = "number";
      input.placeholder = "Monto cuota";
      input.style.marginTop = "10px";

      const registrarBtn = document.createElement("button");
      registrarBtn.textContent = "Registrar";
      registrarBtn.style.marginLeft = "10px";

      registrarBtn.onclick = async () => {
        if (cuotaSeleccionada !== null && input.value) {
          cuotas[cuotaSeleccionada] = {
            monto: Number(input.value),
            fecha: new Date().toISOString()
          };
          await updateDoc(doc(db, "clientes", docSnap.id), { cuotas });
          mostrarClientes();
        }
      };

      cuotasContainer.appendChild(input);
      cuotasContainer.appendChild(registrarBtn);
    }

    // Botón "+" y buscador
    const addButton = document.createElement("button");
    addButton.textContent = "+";
    addButton.style.marginTop = "15px";
    li.appendChild(addButton);

    const buscador = document.createElement("input");
    buscador.type = "text";
    buscador.placeholder = "Buscar producto...";
    buscador.style.display = "none";
    li.appendChild(buscador);

    const productosSelect = document.createElement("select");
    productosSelect.style.display = "none";
    li.appendChild(productosSelect);

    const cantidadInput = document.createElement("input");
    cantidadInput.type = "number";
    cantidadInput.min = 1;
    cantidadInput.value = 1;
    cantidadInput.style.display = "none";
    li.appendChild(cantidadInput);

    function renderOpciones(lista) {
      productosSelect.innerHTML = `<option value="">Seleccionar producto...</option>`;
      lista.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = `[${p.orden}] ${p.nombre} (${p.color || ""}) - $${p.precio}`;
        productosSelect.appendChild(opt);
      });
    }

    // Inicializar con todo el catálogo
    renderOpciones(catalogoProductos);

    // Filtrar dinámicamente según lo que escribas en el buscador
    buscador.addEventListener("input", () => {
      const filtro = buscador.value.toLowerCase();
      const filtrados = catalogoProductos.filter(p =>
        p.nombre.toLowerCase().includes(filtro)
      );
      renderOpciones(filtrados);
    });

    // Toggle único del botón "+"
    addButton.addEventListener("click", () => {
      const visible = productosSelect.style.display === "none";
      productosSelect.style.display = visible ? "inline-block" : "none";
      cantidadInput.style.display = visible ? "inline-block" : "none";
      buscador.style.display = visible ? "inline-block" : "none";
    });

    // Lista de productos ya cargados
    const productosList = document.createElement("ul");
    productosList.style.marginTop = "5px";

    (data.productos || []).forEach((p) => {
      const item = document.createElement("li");
      item.textContent = `[${p.orden}] Producto: ${p.nombre} (${p.color || ""}) (Cantidad: ${p.cantidad}) - $${p.precio}`;
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

    // Evento al seleccionar producto nuevo
    productosSelect.addEventListener("change", async () => {
      const productoId = productosSelect.value;
      const cantidad = parseInt(cantidadInput.value, 10);
      if (!productoId) return;
      if (isNaN(cantidad) || cantidad <= 0) {
        alert("La cantidad debe ser mayor a 0");
        return;
      }

      // 🔹 Buscar producto por ID en el catálogo
      const productoInfo = catalogoProductos.find(p => p.id === productoId);
      if (!productoInfo) {
        alert("Producto no encontrado en catálogo");
        return;
      }

      const clienteRef = doc(db, "clientes", docSnap.id);
      const clienteSnap = await getDoc(clienteRef);
      let productosActuales = clienteSnap.data().productos || [];

      // 🔹 Validación de duplicados por ID
      const existente = productosActuales.find(p => p.id === productoId);
      if (existente) {
        alert(`El producto "${productoInfo.nombre}" ya estaba cargado.`);
        return;
      } else {
        productosActuales.push({
          id: productoInfo.id,
          nombre: productoInfo.nombre,
          color: productoInfo.color,
          precio: productoInfo.precio,
          cantidad,
          orden: productoInfo.orden
        });
      }

      await updateDoc(clienteRef, { productos: productosActuales });

      // Render inmediato
      const item = document.createElement("li");
      item.textContent = `[${productoInfo.orden}] Producto: ${productoInfo.nombre} (${productoInfo.color}) (Cantidad: ${cantidad}) - $${productoInfo.precio}`;
      item.dataset.productoId = productoInfo.id;

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Eliminar";
      deleteButton.style.marginLeft = "10px";
      deleteButton.addEventListener("click", () => {
        eliminarProducto(docSnap.id, item.dataset.productoId, item, headerDiv);
      });

      item.appendChild(deleteButton);
      productosList.appendChild(item);

      // Recalcular total
      let nuevoTotal = productosActuales.reduce((acc, prod) => acc + prod.precio * prod.cantidad, 0);
      headerDiv.textContent = `[${data.nemonico || ""}] ${data.nombre} - Tel: ${data.telefono || "N/A"} - ${data.fecha} | Código: ${docSnap.id} | Total: $${nuevoTotal} | Pagado: ${totalPagado} | Pendiente: ${nuevoTotal - totalPagado}`;

      productosSelect.style.display = "none";
      cantidadInput.style.display = "none";
      buscador.style.display = "none";
    });

    lista.appendChild(li);
  });
}

// 🔹 Mostrar ventas cerradas
async function mostrarVentasCerradas() {
  await cargarCatalogo();
  const lista = document.getElementById("listaVentasCerradas");
  if (!lista) return;
  lista.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "ventasCerradas"));

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();

    const li = document.createElement("li");
const fechaCliente = data.fecha 
  ? new Date(data.fecha).toLocaleDateString() 
  : "Sin fecha";

const fechaCierre = data.fechaCierre 
  ? new Date(data.fechaCierre).toLocaleDateString() 
  : "Sin fecha";

li.textContent = `[${data.nemonico || ""}] ${data.nombre} - Tel: ${data.telefono || "N/A"} 
- Fecha cliente: ${fechaCliente} 
- Fecha cierre: ${fechaCierre} 
| Código: ${data.etiqueta} | Total: $${data.total}`;    
const productosList = document.createElement("ul");
    (data.productos || []).forEach(p => {
      const item = document.createElement("li");
      item.textContent = `[${p.orden}] Producto: ${p.nombre} (${p.color || ""}) (Cantidad: ${p.cantidad}) - $${p.precio}`;
      productosList.appendChild(item);
    });

    li.appendChild(productosList);
    lista.appendChild(li);
  });
}
// 🔹 Terminar compra y actualizar stock


async function terminarCompra(clienteId) {
  
  const clienteRef = doc(db, "clientes", clienteId);
  const clienteSnap = await getDoc(clienteRef);

  if (!clienteSnap.exists()) {
    console.error(`Cliente con id ${clienteId} no encontrado`);
    return;
  }

  const clienteData = clienteSnap.data();

  // 🔹 Log inicial
  console.log("Cliente completo:", clienteData);
  console.log("Productos del cliente:", clienteData.productos);

// Guardar venta cerrada con fecha de cierre
await addDoc(collection(db, "ventasCerradas"), {
  ...clienteData,                     // todos los datos originales
  fechaCierre: new Date().toISOString() // 👈 fecha del momento de cierre
});
  // 🔹 Restar stock general
for (const prod of clienteData.productos || []) {
  console.log("Procesando producto:", prod);

  if (!prod.id) {
    console.warn("Producto sin ID, no se descuenta:", prod);
    continue;
  }

  const productoRef = doc(db, "productos", p.id);
  const productoSnap = await getDoc(productoRef);

  if (!productoSnap.exists()) {
    console.warn("No existe producto en Firestore con ID:", prod.id);
    continue;
  }

  const data = productoSnap.data();
  const stockActual = Number(data.stock) || 0;
  const cantidad = Number(prod.cantidad) || 0;
  const nuevoStock = Math.max(0, stockActual - cantidad);

  console.log(`Stock actual: ${stockActual}, cantidad vendida: ${cantidad}, nuevo stock: ${nuevoStock}`);

  await updateDoc(productoRef, { stock: nuevoStock });

    // 🔹 Confirmación inmediata
    const checkSnap = await getDoc(productoRef);
    console.log(`Stock confirmado en Firestore: ${checkSnap.data().stock}`);
  }

  // Eliminar cliente
  await deleteDoc(clienteRef);

  // Refrescar listas
  mostrarClientes();
  mostrarVentasCerradas();
}

// 🔹 Mantener DOMContentLoaded para que todo se pinte al cargar
document.addEventListener("DOMContentLoaded", async () => {
  await cargarCatalogo();
  // Botón que abre el modal de stock
const btnSubirModal = document.getElementById("btnSubirModal");
const modalStock = document.getElementById("modalStock");
const cancelarBtn = document.getElementById("cancelarBtn");

if (btnSubirModal && modalStock) {
  btnSubirModal.addEventListener("click", () => {
    modalStock.style.display = "flex"; // 👈 muestra el modal
  });
}

if (cancelarBtn && modalStock) {
  cancelarBtn.addEventListener("click", () => {
    modalStock.style.display = "none"; // 👈 cierra el modal
  });
}

  // 🔹 Buscador por nombre (stock.html)
  const buscador = document.getElementById("buscador");
  if (buscador) {
    buscador.addEventListener("input", () => {
      const filtro = buscador.value.toLowerCase();
      const resultados = catalogoProductos.filter(p =>
        p.nombre.toLowerCase().includes(filtro)
      );
      const lista = document.getElementById("resultadosBusqueda");
      lista.innerHTML = "";
      resultados.forEach(p => {
        const li = document.createElement("li");
        li.textContent = `[${p.orden}] ${p.nombre} - Stock: ${p.stock} - Precio: $${p.precio} - ID: ${p.id}`;
        lista.appendChild(li);
      });
    });
  }

// 🔹 Buscador por ID exacto (stock.html)
const buscadorEspecial = document.getElementById("buscadorEspecial");

if (buscadorEspecial) {
  buscadorEspecial.addEventListener("input", () => {
    const filtro = buscadorEspecial.value.trim().toUpperCase();
    const listado = document.getElementById("listadoGeneral");
    if (!listado) return;

    const cards = listado.querySelectorAll(".producto-card");
    let encontrados = 0;

    cards.forEach(card => {
      const texto = card.querySelector("h3")?.textContent || "";
      if (texto.includes(`[${filtro}]`)) {
        card.style.display = "block";
        encontrados++;
      } else {
        card.style.display = "none";
      }
    });

    // 🔹 Si no se encontró nada, mostrar alerta
    if (filtro && encontrados === 0) {
      alert(`No se encontró producto con orden ${filtro}`);
    }
  });
}
// Buscador dentro del modal (se activa al escribir en "Nombre")
const inputNombre = document.getElementById("nombre");
if (inputNombre) {
  inputNombre.addEventListener("input", () => {
    const filtro = inputNombre.value.toLowerCase();
    const resultados = catalogoProductos.filter(p =>
      p.nombre.toLowerCase().includes(filtro)
    );
    const lista = document.getElementById("listaResultadosModal");
    lista.innerHTML = "";

    resultados.forEach(p => {
      const card = document.createElement("div");
      card.className = "producto-card";
      card.innerHTML = `
        <h3 class="editable">${p.nombre}</h3>
        <p><strong>Precio:</strong> $${p.precio}</p>
        <p><strong>Stock:</strong> ${p.stock}</p>
        <p><strong>Color/Sabor:</strong> ${p.color || "-"}</p>
        <p><strong>Categoría:</strong> ${p.categoria || "-"}</p>
        <p><strong>Orden:</strong> ${p.orden || "-"}</p>
      `;

      // 🔹 Evento de click en el nombre
      card.querySelector(".editable").addEventListener("click", async () => {
        const confirmar = confirm("¿Seguro que querés editar este producto?");
        if (!confirmar) return;

        // Prompts para todos los campos
        const nuevoNombre = prompt("Editar nombre:", p.nombre);
        const nuevoStock = prompt("Editar stock:", p.stock);
        const nuevoPrecio = prompt("Editar precio:", p.precio);
        const nuevoCategoria = prompt("Editar categoría:", p.categoria);
        const nuevoColor = prompt("Editar color/sabor:", p.color);

        // 🔹 Tomar archivo del input de imagen opcional
        const imagenFile = document.getElementById(`imagenEdit-${p.id}`).files[0];
        let nuevaImagenUrl = null;
        if (imagenFile) {
          nuevaImagenUrl = await subirImagenCloudinary(imagenFile);
        }

        // Validar que no sean null (cancelado)
        if (
          nuevoNombre !== null &&
          nuevoStock !== null &&
          nuevoPrecio !== null &&
          nuevoCategoria !== null &&
          nuevoColor !== null
        ) {
          try {
            const ref = doc(db, "productos", p.id);
            const updateData = {
              nombre: nuevoNombre.trim(),
              stock: Number(nuevoStock),
              precio: Number(nuevoPrecio),
              categoria: nuevoCategoria.trim(),
              color: nuevoColor.trim()
            };

            // 🔹 Si hay nueva imagen, se actualiza
            if (nuevaImagenUrl) {
              updateData.imagen = nuevaImagenUrl;
            }

            await updateDoc(ref, updateData);

            alert("Producto actualizado correctamente ✅");
            await cargarCatalogo(); // refrescar catálogo
          } catch (error) {
            console.error("Error al actualizar producto:", error);
            alert("Hubo un error al actualizar ❌");
          }
        }
      });

      lista.appendChild(card);
    });
  });
}// Guardar producto desde el modal
const formStock = document.getElementById("formStock");

if (formStock) {
  // 🔹 Generar orden único en secuencia (M1, M2, M3...)
  async function obtenerNuevoOrdenManual() {
    const productosSnap = await getDocs(collection(db, "productos"));
    let maxNum = 0;

    productosSnap.forEach(docSnap => {
      const prod = docSnap.data();
      const ordenStr = prod.orden ? String(prod.orden) : "";
      if (ordenStr.startsWith("M")) {
        const num = parseInt(ordenStr.substring(1), 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });

    // siempre asigna el siguiente consecutivo
    return "M" + (maxNum + 1);
  }

// 🔹 Función para subir imagen a Cloudinary
async function subirImagenCloudinary(file) {
  const url = "https://api.cloudinary.com/v1_1/duduckoiw/image/upload";
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "glowzza_preset");
  formData.append("folder", "glowzzaimages");

  const res = await fetch(url, { method: "POST", body: formData });
  const data = await res.json();
  return data.secure_url;
}

// 🔹 Evento submit del formulario (cargar producto nuevo)
const formStock = document.getElementById("formStock");
if (formStock) {
  formStock.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const color = document.getElementById("color").value.trim();
    const precio = Number(document.getElementById("precio").value);
    const cantidad = Number(document.getElementById("cantidad").value);
    const fecha = document.getElementById("fecha").value;
    const categoria = document.getElementById("categoria").value.trim();
    const sku = document.getElementById("sku").value.trim();
    const imagenFile = document.getElementById("imagen").files[0];

    try {
      // 🔹 Generar orden único con prefijo M
      const nuevoOrden = await obtenerNuevoOrdenManual();

      // 🔹 Subir imagen a Cloudinary
      const imagenUrl = await subirImagenCloudinary(imagenFile);

      // 🔹 Guardar en Firebase con la URL de Cloudinary
      await addDoc(collection(db, "productos"), {
        orden: nuevoOrden,   // 👈 siempre en secuencia M1, M2, M3...
        nombre,
        color,
        precio,
        stock: cantidad,
        fecha,
        categoria,
        sku: sku || null,
        imagen: imagenUrl,
        creadoEn: new Date().toISOString()
      });

      alert("Producto guardado correctamente ✅");
      location.reload();

      document.getElementById("modalStock").style.display = "none";
      formStock.reset();
      await cargarCatalogo();
      mostrarClientes();
      mostrarVentasCerradas();
    } catch (error) {
      console.error("Error al guardar producto:", error);
      alert("Hubo un error al guardar el producto ❌");
    }
  });
}
}

// 🔹 Mantener buscador de clientes separado
mostrarClientes();
mostrarVentasCerradas();
  });
