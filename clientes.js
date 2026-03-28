// clientes.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, getDocs, collection, deleteDoc, doc, addDoc, updateDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 🔹 Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBDrfX2Fszw9-M1DwzX_Sk63et9tw4ddOU",
  authDomain: "glowzzainventario.firebaseapp.com",
  projectId: "glowzzainventario",
  storageBucket: "glowzzainventario.appspot.com",
  messagingSenderId: "159721581844",
  appId: "1:159721581844:web:f62cdb303258dc847b6601",
  measurementId: "G-0FR3Q6P3L2"
};

// 🔹 Inicializar Firebase y Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🔹 Manejo de pestañas
function mostrarTab(tab) {
  const clientesTab = document.getElementById("tabClientes");
  const ventasTab = document.getElementById("tabVentas");
  const eliminarTab = document.getElementById("eliminar");

  if (clientesTab) clientesTab.style.display = (tab === "clientes") ? "block" : "none";
  if (ventasTab) ventasTab.style.display = (tab === "ventas") ? "block" : "none";
  if (eliminarTab) eliminarTab.style.display = (tab === "eliminar") ? "block" : "none";

  const buttons = document.querySelectorAll(".tabs button");
  buttons.forEach(btn => btn.classList.remove("active"));
  if (tab === "clientes" && buttons[0]) buttons[0].classList.add("active");
  else if (tab === "ventas" && buttons[1]) buttons[1].classList.add("active");
  else if (tab === "eliminar" && buttons[2]) buttons[2].classList.add("active");
}

// 🔹 Toast flotante
function mostrarToast(mensaje, tipo = "info") {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = mensaje;

  if (tipo === "success") toast.style.background = "#2ecc71";
  else if (tipo === "error") toast.style.background = "#e74c3c";
  else toast.style.background = "#c62828";

  document.body.appendChild(toast);

  setTimeout(() => { toast.style.opacity = "1"; }, 100);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

// 🔹 Registrar cliente con etiqueta
document.addEventListener("DOMContentLoaded", () => {
  const clienteForm = document.getElementById("clienteForm");
  if (clienteForm) {
    clienteForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nombre = document.getElementById("nombre").value.trim();
      const telefono = document.getElementById("telefono").value.trim();
      const nemonico = document.getElementById("nemonico").value.trim();
      const fecha = document.getElementById("fecha").value;

      if (!nombre || !telefono || !fecha) {
        mostrarToast("⚠️ Completá todos los campos obligatorios", "error");
        return;
      }

      // 🔹 Generar etiqueta única
      const etiqueta = "CL-" + Date.now();

      try {
        await addDoc(collection(db, "clientes"), { nombre, telefono, nemonico, fecha, etiqueta });
        mostrarToast("✅ Cliente registrado correctamente", "success");
        clienteForm.reset();
        mostrarClientes();
      } catch (error) {
        console.error("Error al registrar cliente:", error);
        mostrarToast("❌ No se pudo registrar el cliente", "error");
      }
    });
  }
});
async function validarCredenciales(usuarioIngresado, passwordIngresado) {
  const snap = await getDocs(collection(db, "cajaCredenciales"));
  let valido = false;

  snap.forEach(docSnap => {
    const data = docSnap.data();
    const usuarioDB = (data.usuario || "").trim();
    const passwordDB = (data.password || "").trim();

    if (
      usuarioIngresado.trim().toLowerCase() === usuarioDB.toLowerCase() &&
      passwordIngresado.trim() === passwordDB
    ) {
      valido = true;
    }
  });

  return valido;
}
// 🔹 Mostrar clientes con buscador de productos, cantidad y botón "+"
async function mostrarClientes() {
  const lista = document.getElementById("listaClientes");
  const contador = document.getElementById("contadorClientes");
  if (!lista || !contador) return;

  lista.innerHTML = "";
  const snap = await getDocs(collection(db, "clientes"));
  let count = 0;

  snap.forEach(docSnap => {
    const data = docSnap.data();
    const li = document.createElement("li");

    // Renderizado visual del cliente
    li.innerHTML = `
      <strong>ID:</strong> ${data.etiqueta || docSnap.id} <br>
      ${data.nombre} - Tel: ${data.telefono} - Fecha: ${data.fecha}
      <button onclick="editarCliente('${docSnap.id}', '${data.nombre}', '${data.telefono}', '${data.nemonico || ""}', '${data.fecha}')">✏️ Editar</button>
      
      <!-- Buscador de productos por cliente -->
      <div class="buscador-productos">
        <input type="text" class="buscadorProductos" placeholder="Buscar producto...">
        <input type="number" class="cantidadProducto" min="1" value="1" style="width:60px; margin-left:5px;">
        <button class="btnAgregarProducto">+</button>
        <div class="menuProductos dropdown-menu"></div>
      </div>
      
      <!-- Lista de productos seleccionados -->
      <ul class="listaProductosCliente"></ul>

      <!-- Botones de estado -->
      <div class="estadoVenta">
        <select class="estadoDespacho">
          <option value="">Estado</option>
          <option value="despachado">Despachado</option>
          <option value="deposito">En depósito</option>
        </select>

        <select class="estadoPago">
          <option value="">Estado</option>
          <option value="pagado">Pagado</option>
          <option value="sinpagar">Sin pagar</option>
        </select>

        <!-- Botón de cierre de venta -->
        <button class="btnCerrarVenta">Cerrar Venta</button>

        <!-- Botón de cuotas -->
        <button class="btnCuotas">Cuotas</button>
      </div>

      <!-- Contenedor donde se mostrarán las cuotas -->
      <div class="cuotasContainer"></div>
    `;

    // 🔹 Guardar datos como atributos en el <li>
    li.setAttribute("data-id", docSnap.id);
    li.setAttribute("data-etiqueta", data.etiqueta || docSnap.id);
    li.setAttribute("data-nombre", data.nombre);
    li.setAttribute("data-telefono", data.telefono);
    li.setAttribute("data-fecha", data.fecha);
    li.setAttribute("data-nemonico", data.nemonico || "");

    // 🔹 Paso 2: Mostrar cuotas si existen
    if (data.cuotas && Array.isArray(data.cuotas)) {
      const cuotasContainer = li.querySelector(".cuotasContainer");
      let pagado = 0;
      data.cuotas.forEach(cuota => {
        const cuotaItem = document.createElement("div");
        cuotaItem.textContent = `Pago: $${cuota.monto} - Fecha: ${new Date(cuota.fecha).toLocaleDateString()}`;
        cuotasContainer.appendChild(cuotaItem);
        pagado += cuota.monto;
      });
      const saldo = (data.total || 0) - pagado;
      const resumen = document.createElement("div");
      resumen.innerHTML = `<strong>Pagado:</strong> $${pagado} - <strong>Falta:</strong> $${saldo}`;
      cuotasContainer.appendChild(resumen);
    }

    lista.appendChild(li);
    count++;
  });

  contador.textContent = count;

  inicializarBuscadoresProductos();
}
// 🔹 Inicializar buscadores de productos (sin descontar stock en "+")
async function inicializarBuscadoresProductos() {
  const snap = await getDocs(collection(db, "productos"));
  const productos = [];
  snap.forEach(docSnap => {
    const data = docSnap.data();
    productos.push({ id: docSnap.id, ...data });
  });

  const buscadores = document.querySelectorAll(".buscadorProductos");
  buscadores.forEach(buscador => {
    const menu = buscador.parentElement.querySelector(".menuProductos");
    const cantidadInput = buscador.parentElement.querySelector(".cantidadProducto");
    const btnAgregar = buscador.parentElement.querySelector(".btnAgregarProducto");
    const listaProductosCliente = buscador.parentElement.parentElement.querySelector(".listaProductosCliente");
    const estadoDespacho = buscador.parentElement.parentElement.querySelector(".estadoDespacho");
    const estadoPago = buscador.parentElement.parentElement.querySelector(".estadoPago");
    const btnCerrarVenta = buscador.parentElement.parentElement.querySelector(".btnCerrarVenta");

    // Mostrar todos los productos
    buscador.addEventListener("focus", () => {
      menu.innerHTML = "";
      productos.forEach(p => {
        const item = document.createElement("div");
        item.textContent = `[${p.orden}] ${p.nombre} - Color: ${p.color} - Stock: ${p.stock} - ID: ${p.codigo || p.id}`;        item.addEventListener("click", () => {
          buscador.value = p.nombre;
          menu.style.display = "none";
        });
        menu.appendChild(item);
      });
      menu.style.display = "block";
    });
    // Filtrar productos mientras se escribe
buscador.addEventListener("input", () => {
  const texto = buscador.value.toLowerCase();
  menu.innerHTML = "";

  productos
    .filter(p =>
      p.nombre.toLowerCase().includes(texto) ||
      (p.color && p.color.toLowerCase().includes(texto)) ||
      (p.orden && p.orden.toLowerCase().includes(texto))
    )
    .forEach(p => {
      const item = document.createElement("div");
      item.textContent = `[${p.orden}] ${p.nombre} - Color: ${p.color} - Stock: ${p.stock} - ID: ${p.codigo || p.id}`;
      item.addEventListener("click", () => {
        buscador.value = p.nombre;
        menu.style.display = "none";
      });
      menu.appendChild(item);
    });

  menu.style.display = "block";
});
li.querySelector(".btnCuotas").addEventListener("click", async () => {
  const monto = prompt("Ingrese monto de la cuota:");
  if (!monto) return;

  const clienteId = li.getAttribute("data-id");
  const clienteRef = doc(db, "clientes", clienteId);

  // Guardar cuota en Firebase dentro del cliente
  await updateDoc(clienteRef, {
    cuotas: arrayUnion({
      monto: parseFloat(monto),
      fecha: new Date().toISOString()
    })
  });

  alert("✅ Cuota registrada correctamente.");
  mostrarClientes(); // refrescar vista para que aparezca la cuota
});
    // Filtrar productos
    buscador.addEventListener("input", () => {
      const termino = buscador.value.toLowerCase();
      menu.innerHTML = "";
      const filtrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(termino) ||
        (p.codigo?.toLowerCase().includes(termino))
      );
filtrados.forEach(p => {
  const item = document.createElement("div");
  item.textContent = `[${p.orden}] ${p.nombre} - Color: ${p.color} - Stock: ${p.stock ?? 0} - ID: ${p.codigo || p.id}`;
  item.addEventListener("click", () => {
    buscador.value = p.nombre;
    menu.style.display = "none";
  });
  menu.appendChild(item);
});      menu.style.display = filtrados.length > 0 ? "block" : "none";
    });

// Botón "+" → valida stock antes de agregar
btnAgregar.addEventListener("click", () => {
  const nombreProducto = buscador.value.trim();
  const cantidad = parseInt(cantidadInput.value, 10);
  if (!nombreProducto) return;

  const producto = productos.find(p => p.nombre.toLowerCase() === nombreProducto.toLowerCase());
  if (!producto) {
    alert("Producto no encontrado.");
    return;
  }

  // 🔹 Validar stock disponible
  if (cantidad > (producto.stock ?? 0)) {
    alert(`Stock insuficiente. Disponible: ${producto.stock ?? 0}`);
    return; // no agrega nada
  }

  // ✅ Si hay stock suficiente, agregar producto con botón de eliminar
  const liProd = document.createElement("li");
  liProd.textContent = `${nombreProducto} - Cantidad: ${cantidad}`;
  const btnEliminar = document.createElement("button");
  btnEliminar.textContent = "❌";
  btnEliminar.style.marginLeft = "10px";
  btnEliminar.addEventListener("click", () => {
    listaProductosCliente.removeChild(liProd);
  });
  liProd.appendChild(btnEliminar);
  listaProductosCliente.appendChild(liProd);

  // Resetear campos
  buscador.value = "";
  cantidadInput.value = 1;
});
estadoPago.addEventListener("change", async () => {
  if (estadoPago.value === "pagado") {
    const usuario = prompt("Ingrese usuario de caja:");
    const password = prompt("Ingrese contraseña de caja:");

    const esValido = await validarCredenciales(usuario, password);

    if (!esValido) {
      alert("Credenciales inválidas. No puede marcar como Pagado.");
      estadoPago.value = "";
    } else {
      alert("Credenciales válidas. Estado marcado como Pagado.");
    }
  }
});
    // Botón "Cerrar Venta" → recién aquí descuenta stock
btnCerrarVenta.addEventListener("click", async () => {
  if (estadoDespacho.value !== "despachado" || estadoPago.value !== "pagado") {
    alert("La venta solo puede cerrarse si está DESPACHADO y PAGADO.");
    return;
  }

  const itemsLi = listaProductosCliente.querySelectorAll("li");
  if (itemsLi.length === 0) {
    alert("⚠️ No se puede cerrar la venta sin productos.");
    return;
  }

  const items = [];
  let totalCliente = 0;
  itemsLi.forEach(li => {
    const [nombreProducto, cantidadTxt] = li.textContent.split(" - Cantidad: ");
    const cantidad = parseInt(cantidadTxt, 10);
    const producto = productos.find(p => p.nombre.toLowerCase() === nombreProducto.toLowerCase());
    items.push({ nombre: nombreProducto, cantidad, precio: producto?.precio ?? 0 });
    totalCliente += (producto?.precio ?? 0) * cantidad;
  });

  const liCliente = btnCerrarVenta.closest("li");

  const ventaData = {
    cliente: {
      id: liCliente.getAttribute("data-id"),
      etiqueta: liCliente.getAttribute("data-etiqueta"),
      nombre: liCliente.getAttribute("data-nombre"),
      telefono: liCliente.getAttribute("data-telefono"),
      fecha: liCliente.getAttribute("data-fecha"),
      nemonico: liCliente.getAttribute("data-nemonico")
    },
    productos: items,
    total: totalCliente,
    estadoDespacho: estadoDespacho.value,
    estadoPago: estadoPago.value,
    fechaCierre: new Date().toISOString(),
    // 🔹 Copiar cuotas si existen en el cliente
    cuotas: data.cuotas || []
  };

  try {
    await addDoc(collection(db, "ventasCerradas"), ventaData);

    for (const item of items) {
      const producto = productos.find(p => p.nombre.toLowerCase() === item.nombre.toLowerCase());
      if (producto) {
        if (item.cantidad > (producto.stock ?? 0)) {
          alert(`Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock ?? 0}`);
          return;
        }
        const productoRef = doc(db, "productos", producto.id);
        await updateDoc(productoRef, {
          stock: (producto.stock ?? 0) - item.cantidad
        });
      }
    }

    await deleteDoc(doc(db, "clientes", ventaData.cliente.id)); // eliminar cliente

    listaProductosCliente.innerHTML = "";
    mostrarVentasCerradas();
    mostrarClientes();

    alert("✅ Venta cerrada, guardada en ventasCerradas, cuotas copiadas y stock actualizado.");
  } catch (error) {
    console.error("Error al cerrar venta:", error);
    alert("❌ Hubo un problema al cerrar la venta.");
  }
});
    // Ocultar menú si se hace click fuera
    document.addEventListener("click", (e) => {
      if (!buscador.contains(e.target) && !menu.contains(e.target)) {
        menu.style.display = "none";
      }
    });
  });
}
// 🔹 Editar cliente
window.editarCliente = function(id, nombre, telefono, nemonico, fecha) {
  const modal = document.getElementById("modalEditarCliente");
  if (!modal) return;

  document.getElementById("editarId").value = id;
  document.getElementById("editarNombre").value = nombre;
  document.getElementById("editarTelefono").value = telefono;
  document.getElementById("editarNemonico").value = nemonico;
  document.getElementById("editarFecha").value = fecha;

  modal.style.display = "block";
};

// 🔹 Guardar cambios al editar cliente
document.addEventListener("DOMContentLoaded", () => {
  const formEditar = document.getElementById("formEditarCliente");
  if (formEditar) {
    formEditar.addEventListener("submit", async (e) => {
      e.preventDefault();

      const id = document.getElementById("editarId").value;
      const nombre = document.getElementById("editarNombre").value.trim();
      const telefono = document.getElementById("editarTelefono").value.trim();
      const nemonico = document.getElementById("editarNemonico").value.trim();
      const fecha = document.getElementById("editarFecha").value;

      if (!id || !nombre || !telefono || !fecha) {
        mostrarToast("⚠️ Completá todos los campos obligatorios", "error");
        return;
      }

      try {
        const clienteRef = doc(db, "clientes", id);
        await updateDoc(clienteRef, { nombre, telefono, nemonico, fecha });
        mostrarToast("✅ Cliente actualizado correctamente", "success");
        document.getElementById("modalEditarCliente").style.display = "none";
        mostrarClientes();
      } catch (error) {
        console.error("Error al actualizar cliente:", error);
        mostrarToast("❌ No se pudo actualizar el cliente", "error");
      }
    });
  }
});

// 🔹 Mostrar lista de ventas cerradas
async function mostrarVentasCerradas() {
  const lista = document.getElementById("listaVentasCerradas");
  const contador = document.getElementById("contadorVentasCerradas");
  if (!lista || !contador) return;

  lista.innerHTML = "";
  const snap = await getDocs(collection(db, "ventasCerradas"));
  let count = 0;

  snap.forEach(docSnap => {
    const data = docSnap.data();
    const li = document.createElement("li");

    // Mostrar datos del cliente
    li.innerHTML = `
      <strong>ID:</strong> ${data.cliente.etiqueta || data.cliente.id} <br>
      Cliente: ${data.cliente.nombre} - Tel: ${data.cliente.telefono} - Fecha: ${data.cliente.fecha} <br>
      Estado: Pago ${data.estadoPago}, Despacho ${data.estadoDespacho} <br>
      <strong>Total:</strong> $${data.total || 0}
    `;

    // Mostrar lista de productos
    const ulProductos = document.createElement("ul");
    if (data.productos && Array.isArray(data.productos)) {
      data.productos.forEach(prod => {
        const liProd = document.createElement("li");
        liProd.textContent = `${prod.nombre} - Cantidad: ${prod.cantidad} - Precio: $${prod.precio ?? 0}`;
        ulProductos.appendChild(liProd);
      });
    }
    li.appendChild(ulProductos);

    // Mostrar cuotas si existen
    if (data.cuotas && Array.isArray(data.cuotas)) {
      const divCuotas = document.createElement("div");
      divCuotas.innerHTML = "<strong>Cuotas:</strong>";
      let pagado = 0;
      data.cuotas.forEach(cuota => {
        const cuotaItem = document.createElement("div");
        cuotaItem.textContent = `Pago: $${cuota.monto} - Fecha: ${cuota.fecha}`;
        divCuotas.appendChild(cuotaItem);
        pagado += cuota.monto;
      });
      const saldo = (data.total || 0) - pagado;
      const resumen = document.createElement("div");
      resumen.innerHTML = `<strong>Pagado:</strong> $${pagado} - <strong>Falta:</strong> $${saldo}`;
      divCuotas.appendChild(resumen);
      li.appendChild(divCuotas);
    }

    lista.appendChild(li);
    count++;
  });

  contador.textContent = count;
}
// 🔹 Buscar para eliminar
async function buscarParaEliminar() {
  const termino = document.getElementById("buscadorEliminar").value.toLowerCase();
  const resultadoDiv = document.getElementById("resultadoEliminar");
  if (!resultadoDiv) return;
  resultadoDiv.innerHTML = "";

  const clientesSnap = await getDocs(collection(db, "clientes"));
  clientesSnap.forEach(docSnap => {
    const data = docSnap.data();
    if (data.nombre.toLowerCase().includes(termino) || (data.etiqueta?.toLowerCase().includes(termino))) {
      resultadoDiv.innerHTML += `
        <div>
          <strong>ID:</strong> ${data.etiqueta} - Cliente: ${data.nombre} - Tel: ${data.telefono}
          <button onclick="pedirCredenciales('${docSnap.id}', 'clientes')">🗑️ Eliminar</button>
        </div>`;
    }
  });

  const ventasSnap = await getDocs(collection(db, "ventasCerradas"));
  ventasSnap.forEach(docSnap => {
    const data = docSnap.data();
    if (data.codigo?.toLowerCase().includes(termino)) {
      resultadoDiv.innerHTML += `
        <div>
          Venta ${data.codigo} - Total: $${data.total}
          <button onclick="pedirCredenciales('${docSnap.id}', 'ventasCerradas')">🗑️ Eliminar</button>
        </div>`;
    }
  });
}

// 🔹 Variables globales para eliminación
let itemAEliminar = null;
let coleccionAEliminar = null;

window.pedirCredenciales = function(id, coleccion) {
  itemAEliminar = id;
  coleccionAEliminar = coleccion;
  const modal = document.getElementById("modalCredenciales");
  if (modal) modal.style.display = "block";
};

// 🔹 Confirmar eliminación
document.addEventListener("DOMContentLoaded", () => {
  const btnConfirmar = document.getElementById("btnConfirmarEliminar");
  if (btnConfirmar) {
    btnConfirmar.addEventListener("click", async () => {
      const usuario = document.getElementById("usuarioCheck").value.trim();
      const password = document.getElementById("passwordCheck").value.trim();

      // 🔹 Validación simple de credenciales
      if (usuario === "admin" && password === "1234") {
        try {
          await deleteDoc(doc(db, coleccionAEliminar, itemAEliminar));
          mostrarToast("✅ Eliminado correctamente", "success");
          document.getElementById("modalCredenciales").style.display = "none";
          mostrarClientes();
          mostrarVentasCerradas();
        } catch (error) {
          console.error("Error al eliminar:", error);
          mostrarToast("❌ No se pudo eliminar", "error");
        }
      } else {
        mostrarToast("⚠️ Credenciales incorrectas", "error");
      }
    });
  }

  // 🔹 Eliminar por ID directo
  const btnEliminarCliente = document.getElementById("btnEliminarCliente");
  if (btnEliminarCliente) {
    btnEliminarCliente.addEventListener("click", async () => {
      const id = document.getElementById("clienteIdEliminar").value.trim();
      if (!id) return;
      try {
        await deleteDoc(doc(db, "clientes", id));
        mostrarToast("✅ Cliente eliminado por ID", "success");
        mostrarClientes();
      } catch (error) {
        console.error("Error al eliminar cliente:", error);
        mostrarToast("❌ No se pudo eliminar el cliente", "error");
      }
    });
  }

  const btnEliminarVenta = document.getElementById("btnEliminarVenta");
  if (btnEliminarVenta) {
    btnEliminarVenta.addEventListener("click", async () => {
      const id = document.getElementById("ventaIdEliminar").value.trim();
      if (!id) return;
      try {
        await deleteDoc(doc(db, "ventasCerradas", id));
        mostrarToast("✅ Venta eliminada por ID", "success");
        mostrarVentasCerradas();
      } catch (error) {
        console.error("Error al eliminar venta:", error);
        mostrarToast("❌ No se pudo eliminar la venta", "error");
      }
    });
  }
});

// 🔹 Inicialización
document.addEventListener("DOMContentLoaded", async () => {
  await mostrarClientes();
  await mostrarVentasCerradas();
  mostrarTab("clientes");
});
// 🔹 Buscador dinámico de clientes
document.addEventListener("DOMContentLoaded", () => {
  const buscadorClientes = document.getElementById("buscadorClientes");
  if (buscadorClientes) {
    buscadorClientes.addEventListener("input", () => {
      const termino = buscadorClientes.value.toLowerCase();
      const lista = document.getElementById("listaClientes");
      const items = lista.getElementsByTagName("li");
      let visible = 0;
      for (let i = 0; i < items.length; i++) {
        const texto = items[i].textContent.toLowerCase();
        const match = texto.includes(termino);
        items[i].style.display = match ? "" : "none";
        if (match) visible++;
      }
if (visible === 0) {
  const mensaje = document.createElement("li");
  mensaje.style.color = "#c0392b";
  mensaje.textContent = "No hay resultados ❌";
  lista.appendChild(mensaje);
}    });
  }

  // 🔹 Buscador dinámico de ventas cerradas
  const buscadorVentas = document.getElementById("buscadorVentas");
  if (buscadorVentas) {
    buscadorVentas.addEventListener("input", () => {
      const termino = buscadorVentas.value.toLowerCase();
      const lista = document.getElementById("listaVentasCerradas");
      const items = lista.getElementsByTagName("li");
      let visible = 0;
      for (let i = 0; i < items.length; i++) {
        const texto = items[i].textContent.toLowerCase();
        const match = texto.includes(termino);
        items[i].style.display = match ? "" : "none";
        if (match) visible++;
      }
if (visible === 0) {
  const mensaje = document.createElement("li");
  mensaje.style.color = "#c0392b";
  mensaje.textContent = "No hay resultados ❌";
  lista.appendChild(mensaje);
}    });
  }
});
// 🔹 Cargar productos desde Firebase y armar menú dinámico
async function cargarProductos() {
  const snap = await getDocs(collection(db, "productos"));
  const productos = [];
  snap.forEach(docSnap => {
    const data = docSnap.data();
    productos.push({ id: docSnap.id, ...data });
  });
  return productos;
}

document.addEventListener("DOMContentLoaded", async () => {
  const buscador = document.getElementById("buscadorProductos");
  const menu = document.getElementById("menuProductos");

  if (buscador && menu) {
const productos = await cargarProductos();

// Mostrar todos los productos al hacer click
buscador.addEventListener("focus", () => {
  menu.innerHTML = "";
  productos.forEach(p => {
    const item = document.createElement("div");
    // 🔹 Ahora mostramos orden, nombre, color, stock e ID/código
    item.textContent = `[${p.orden}] ${p.nombre} - Color: ${p.color} - Stock: ${p.stock} - ID: ${p.codigo || p.id}`;
    
    item.addEventListener("click", () => {
      buscador.value = p.nombre;
      menu.style.display = "none";
    });
    
    menu.appendChild(item);
  });
  menu.style.display = "block";
});
    // Filtrar productos al escribir
    buscador.addEventListener("input", () => {
      const termino = buscador.value.toLowerCase();
      menu.innerHTML = "";
      const filtrados = productos.filter(p => 
        p.nombre.toLowerCase().includes(termino) || 
        (p.codigo?.toLowerCase().includes(termino))
      );
filtrados.forEach(p => {
  const item = document.createElement("div");
  item.textContent = `[${p.orden}] ${p.nombre} - Color: ${p.color} - Stock: ${p.stock ?? 0} - ID: ${p.codigo || p.id}`;
  item.addEventListener("click", () => {
    buscador.value = p.nombre;
    menu.style.display = "none";
  });
  menu.appendChild(item);
});      menu.style.display = filtrados.length > 0 ? "block" : "none";
    });

    // Ocultar menú si se hace click fuera
    document.addEventListener("click", (e) => {
      if (!buscador.contains(e.target) && !menu.contains(e.target)) {
        menu.style.display = "none";
      }
    });
  }
});
// 🔹 Exponer funciones globales
window.mostrarTab = mostrarTab;
window.buscarParaEliminar = buscarParaEliminar;
window.mostrarClientes = mostrarClientes;
window.mostrarVentasCerradas = mostrarVentasCerradas;
