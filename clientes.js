// clientes.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, getDocs, collection, deleteDoc, doc, addDoc, updateDoc, 
  increment, arrayUnion, arrayRemove 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
      
      <div class="buscador-productos">
        <input type="text" class="buscadorProductos" placeholder="Buscar producto...">
        <input type="number" class="cantidadProducto" min="1" value="1" style="width:60px; margin-left:5px;">
        <button class="btnAgregarProducto">+</button>
        <div class="menuProductos dropdown-menu"></div>
      </div>
      
      <ul class="listaProductosCliente"></ul>

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

        <button class="btnCerrarVenta">Cerrar Venta</button>
        <button class="btnCuotas">Cuotas</button>
      </div>

      <div class="cuotasContainer"></div>
    `;

    // Atributos
    li.setAttribute("data-id", docSnap.id);
    li.setAttribute("data-etiqueta", data.etiqueta || docSnap.id);
    li.setAttribute("data-nombre", data.nombre);
    li.setAttribute("data-telefono", data.telefono);
    li.setAttribute("data-fecha", data.fecha);
    li.setAttribute("data-nemonico", data.nemonico || "");

    // 🔹 Mostrar productos persistentes si existen
    if (data.productos && Array.isArray(data.productos)) {
      const listaProductosCliente = li.querySelector(".listaProductosCliente");

      data.productos.forEach(prod => {
        const liProd = document.createElement("li");
        liProd.textContent = `[${prod.orden}] ${prod.nombre} - Color: ${prod.color} - Cantidad: ${prod.cantidad} - ID: ${prod.etiqueta} - Precio: $${prod.precio ?? 0}`;

        // Botón eliminar producto
        const btnEliminar = document.createElement("button");
        btnEliminar.textContent = "❌";
        btnEliminar.style.marginLeft = "10px";
        btnEliminar.addEventListener("click", async () => {
          listaProductosCliente.removeChild(liProd);
          const clienteId = li.getAttribute("data-id");
          const clienteRef = doc(db, "clientes", clienteId);
          await updateDoc(clienteRef, { productos: arrayRemove(prod) });
          // 🔹 Recalcular total al eliminar
          actualizarTotal(listaProductosCliente);
        });

        liProd.appendChild(btnEliminar);
        listaProductosCliente.appendChild(liProd);
      });

      // 🔹 Recalcular total al cargar productos
      actualizarTotal(listaProductosCliente);
    }

// 🔹 Mostrar cuotas si existen
if (data.cuotas && Array.isArray(data.cuotas)) {
  const cuotasContainer = li.querySelector(".cuotasContainer");
  let pagado = 0;

  data.cuotas.forEach(cuota => {
    const cuotaItem = document.createElement("div");
    cuotaItem.textContent = `Pago: $${cuota.monto} - Fecha: ${new Date(cuota.fecha).toLocaleDateString()}`;

    // Botón eliminar cuota con credenciales
    const btnEliminarCuota = document.createElement("button");
    btnEliminarCuota.textContent = "❌";
    btnEliminarCuota.style.marginLeft = "10px";

    btnEliminarCuota.addEventListener("click", async () => {
      const usuario = prompt("Ingrese usuario cajero:");
      const clave = prompt("Ingrese clave cajero:");
      const valido = await validarCredenciales(usuario, clave);

      if (valido) {
        const clienteId = li.getAttribute("data-id");
        const clienteRef = doc(db, "clientes", clienteId);
        await updateDoc(clienteRef, { cuotas: arrayRemove(cuota) });

        cuotaItem.remove();
        alert("Cuota eliminada correctamente.");

        // 🔹 Recalcular resumen después de eliminar
        const totalCliente = parseFloat(
          li.querySelector(".resumenTotal")?.textContent.replace(/\D/g, "")
        ) || 0;
        pagado -= cuota.monto;
        const falta = Math.max(totalCliente - pagado, 0);

        const resumen = cuotasContainer.querySelector(".resumenCuotas");
        if (resumen) {
          resumen.innerHTML = `<strong>Pagado:</strong> $${pagado} - <strong>Falta:</strong> $${falta}`;
        }
      } else {
        alert("Credenciales inválidas. No se eliminó la cuota.");
      }
    });

    cuotaItem.appendChild(btnEliminarCuota);
    cuotasContainer.appendChild(cuotaItem);
    pagado += cuota.monto;
  });

  // 🔹 Cálculo inicial de Pagado y Falta
  const totalCliente = parseFloat(
    li.querySelector(".resumenTotal")?.textContent.replace(/\D/g, "")
  ) || 0;
  const falta = Math.max(totalCliente - pagado, 0);

  const resumen = document.createElement("div");
  resumen.classList.add("resumenCuotas");
  resumen.innerHTML = `<strong>Pagado:</strong> $${pagado} - <strong>Falta:</strong> $${falta}`;
  cuotasContainer.appendChild(resumen);
}
    lista.appendChild(li);
    count++;
  });

  contador.textContent = `Clientes: ${count}`;
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
    const liCliente = buscador.closest("li"); // 🔹 obtener el <li> del cliente
    const listaProductosCliente = liCliente.querySelector(".listaProductosCliente");
    const estadoDespacho = liCliente.querySelector(".estadoDespacho");
    const estadoPago = liCliente.querySelector(".estadoPago");
    const btnCerrarVenta = liCliente.querySelector(".btnCerrarVenta");
    const btnCuotas = liCliente.querySelector(".btnCuotas");

    // Botón Cuotas
    if (btnCuotas) {
      btnCuotas.addEventListener("click", async () => {
        const monto = prompt("Ingrese monto de la cuota:");
        if (!monto) return;

        const clienteId = liCliente.getAttribute("data-id");
        const clienteRef = doc(db, "clientes", clienteId);

        await updateDoc(clienteRef, {
          cuotas: arrayUnion({
            monto: parseFloat(monto),
            fecha: new Date().toISOString()
          })
        });

        alert("✅ Cuota registrada correctamente.");
        mostrarClientes(); // refrescar vista
      });
    }

    // Mostrar todos los productos al enfocar
    buscador.addEventListener("focus", () => {
      menu.innerHTML = "";
      productos.forEach(p => {
        const item = document.createElement("div");
item.textContent = `[${p.orden}] ${p.nombre} - Color: ${p.color} - Stock: ${p.stock ?? 0} - Precio: $${p.precio ?? 0} - ID: ${p.codigo || p.id}`;        item.addEventListener("click", () => {
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

    // Botón "+" → valida stock antes de agregar
btnAgregar.addEventListener("click", async () => {
  const nombreProducto = buscador.value.trim();
  const cantidad = parseInt(cantidadInput.value, 10);
  if (!nombreProducto) return;

  const producto = productos.find(p => p.nombre.toLowerCase() === nombreProducto.toLowerCase());
  if (!producto) {
    alert("Producto no encontrado.");
    return;
  }

  if (cantidad > (producto.stock ?? 0)) {
    alert(`Stock insuficiente. Disponible: ${producto.stock ?? 0}`);
    return;
  }

  const prodCliente = {
    nombre: producto.nombre,
    cantidad,
    orden: producto.orden ?? "",
    etiqueta: producto.codigo || producto.id,
    color: producto.color ?? "",
    precio: producto.precio ?? 0
  };

  const liProd = document.createElement("li");
  liProd.textContent = `[${prodCliente.orden}] ${prodCliente.nombre} - Color: ${prodCliente.color} - Cantidad: ${prodCliente.cantidad} - ID: ${prodCliente.etiqueta} - Precio: $${prodCliente.precio}`;

  // Botón eliminar
  const btnEliminar = document.createElement("button");
  btnEliminar.textContent = "❌";
  btnEliminar.style.marginLeft = "10px";

  btnEliminar.addEventListener("click", async () => {
    listaProductosCliente.removeChild(liProd);

    const clienteId = liCliente.getAttribute("data-id");
    const clienteRef = doc(db, "clientes", clienteId);
    await updateDoc(clienteRef, {
      productos: arrayRemove(prodCliente)
    });

    // 🔹 Recalcular total al eliminar
    actualizarTotal(listaProductosCliente);
  });

  liProd.appendChild(btnEliminar);
  listaProductosCliente.appendChild(liProd);

  // 🔹 Guardar en Firebase
  const clienteId = liCliente.getAttribute("data-id");
  const clienteRef = doc(db, "clientes", clienteId);
  await updateDoc(clienteRef, {
    productos: arrayUnion(prodCliente)
  });

  // 🔹 Recalcular total al agregar
  actualizarTotal(listaProductosCliente);

  buscador.value = "";
  cantidadInput.value = 1;
});
    // Validar credenciales al marcar como pagado
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

    // Botón "Cerrar Venta"
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

  // Paso 1: recorrer productos y calcular precio/total
itemsLi.forEach(liProd => {
  const texto = liProd.textContent;

  const matchPrecio = texto.match(/Precio: \$([0-9]+)/);
  const matchCantidad = texto.match(/Cantidad: (\d+)/);
  const matchId = texto.match(/ID: ([A-Za-z0-9]+)/);

  const precio = matchPrecio ? parseFloat(matchPrecio[1]) : 0;
  const cantidad = matchCantidad ? parseInt(matchCantidad[1], 10) : 1;
  const productoId = matchId ? matchId[1] : null;

  // 🔹 Extraer orden y color directamente del texto
  const matchOrden = texto.match(/\[(.*?)\]/);
  const matchColor = texto.match(/Color:\s*([A-Za-z]+)/);

  const orden = matchOrden ? matchOrden[1] : "";
  const color = matchColor ? matchColor[1] : "";

  // 🔹 Extraer nombre limpio (sin orden ni color)
  const matchNombre = texto.match(/^\[.*?\]\s*(.*?)\s-\sColor/);
  const nombreProducto = matchNombre ? matchNombre[1] : texto;

  totalCliente += precio * cantidad;

  items.push({
    id: productoId,
    orden,
    nombre: nombreProducto,
    color,
    cantidad,
    precio
  });
});
  // Paso 2: armar ventaData
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
    cuotas: JSON.parse(liCliente.getAttribute("data-cuotas") || "[]")
  };

  try {
    // Paso 3: guardar venta
    await addDoc(collection(db, "ventasCerradas"), ventaData);

    // Paso 4: actualizar stock con ID correcto
    for (const item of items) {
      try {
        if (!item.id) continue;
        const productoRef = doc(db, "productos", item.id);
        await updateDoc(productoRef, {
          stock: increment(-item.cantidad)
        });
      } catch (error) {
        console.warn(`No se pudo actualizar stock de ${item.nombre}`, error);
      }
    }

    // Paso 5: eliminar cliente y refrescar vistas
    await deleteDoc(doc(db, "clientes", ventaData.cliente.id));
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
  const contador = document.getElementById("contadorVentas"); // corregido
  if (!lista || !contador) return;

  lista.innerHTML = "";
  const snap = await getDocs(collection(db, "ventasCerradas"));
  let count = 0;

  snap.forEach(docSnap => {
    const data = docSnap.data();
    const li = document.createElement("li");

    li.innerHTML = `
      <strong>ID:</strong> ${data.cliente.etiqueta || data.cliente.id} <br>
      Cliente: ${data.cliente.nombre} - Tel: ${data.cliente.telefono} - Fecha: ${data.cliente.fecha} <br>
      <strong>Total:</strong> $${data.total || 0}
    `;

    const ulProductos = document.createElement("ul");
    if (data.productos && Array.isArray(data.productos)) {
      data.productos.forEach(prod => {
        const liProd = document.createElement("li");
liProd.textContent = `[${prod.orden}] ${prod.nombre} - Color: ${prod.color} - Cantidad: ${prod.cantidad} - ID: ${prod.id} - Precio: $${prod.precio ?? 0}`;        ulProductos.appendChild(liProd);
      });
    }
    li.appendChild(ulProductos);

    // Mostrar cuotas si existen (solo listado, sin resumen)
    if (data.cuotas && Array.isArray(data.cuotas)) {
      const divCuotas = document.createElement("div");

      data.cuotas.forEach(cuota => {
        const cuotaItem = document.createElement("div");
        cuotaItem.textContent = `Pago: $${cuota.monto} - Fecha: ${new Date(cuota.fecha).toLocaleDateString()}`;
        divCuotas.appendChild(cuotaItem);
      });

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
item.textContent = `[${p.orden}] ${p.nombre} - Color: ${p.color} - Stock: ${p.stock ?? 0} - Precio: $${p.precio ?? 0} - ID: ${p.codigo || p.id}`;  item.addEventListener("click", () => {
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
function actualizarTotal(listaProductosCliente) {
  let totalCliente = 0;

  listaProductosCliente.querySelectorAll("li").forEach(liProd => {
    const texto = liProd.textContent;
    const matchPrecio = texto.match(/Precio: \$([0-9]+)/);
    const matchCantidad = texto.match(/Cantidad: (\d+)/);

    const precio = matchPrecio ? parseFloat(matchPrecio[1]) : 0;
    const cantidad = matchCantidad ? parseInt(matchCantidad[1], 10) : 1;

    totalCliente += precio * cantidad;
  });

  let resumenTotal = listaProductosCliente.querySelector(".resumenTotal");
  if (!resumenTotal) {
    resumenTotal = document.createElement("div");
    resumenTotal.classList.add("resumenTotal");
  }

  resumenTotal.innerHTML = `
    <strong style="
      font-size: 1.5em;
      color: #2c3e50;
      background: #f1c40f;
      padding: 5px 10px;
      border-radius: 5px;
      display:inline-block;">
      Total productos: $${totalCliente}
    </strong>`;

  // 🔹 Insertar siempre al inicio
  listaProductosCliente.insertBefore(resumenTotal, listaProductosCliente.firstChild);
}
// 🔹 Exponer funciones globales
window.mostrarTab = mostrarTab;
window.buscarParaEliminar = buscarParaEliminar;
window.mostrarClientes = mostrarClientes;
window.mostrarVentasCerradas = mostrarVentasCerradas;
