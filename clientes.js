// clientes.js
import { db, getDocs, collection, deleteDoc, doc, addDoc, updateDoc } from "./firebase.js";

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

  if (tipo === "success") toast.style.background = "#2ecc71"; // verde
  else if (tipo === "error") toast.style.background = "#e74c3c"; // rojo
  else toast.style.background = "#c62828"; // rojo oscuro

  document.body.appendChild(toast);

  setTimeout(() => { toast.style.opacity = "1"; }, 100);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

// 🔹 Registrar cliente
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

      try {
        await addDoc(collection(db, "clientes"), { nombre, telefono, nemonico, fecha });
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

// 🔹 Mostrar lista de clientes con botón de edición
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
    li.innerHTML = `
      ${data.nombre} - Tel: ${data.telefono} - Fecha: ${data.fecha}
      <button onclick="editarCliente('${docSnap.id}', '${data.nombre}', '${data.telefono}', '${data.nemonico || ""}', '${data.fecha}')">✏️ Editar</button>
    `;
    lista.appendChild(li);
    count++;
  });
  contador.textContent = count;
}

// 🔹 Editar cliente (abre modal con datos)
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
  const contador = document.getElementById("contadorVentas");
  if (!lista || !contador) return;

  lista.innerHTML = "";
  const snap = await getDocs(collection(db, "ventasCerradas"));
  let count = 0;
  snap.forEach(docSnap => {
    const data = docSnap.data();
    const li = document.createElement("li");
    li.textContent = `Venta ${data.codigo} - Total: $${data.total}`;
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
    if (data.nombre.toLowerCase().includes(termino) || (data.codigo?.toLowerCase().includes(termino))) {
      resultadoDiv.innerHTML += `
        <div>
          Cliente: ${data.nombre} - Tel: ${data.telefono}
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

// 🔹 Inicialización
document.addEventListener("DOMContentLoaded", async () => {
  await mostrarClientes();
  await mostrarVentasCerradas();
  mostrarTab("clientes");
});

// 🔹 Exponer funciones globales
window.mostrarTab = mostrarTab;
window.buscarParaEliminar = buscarParaEliminar;
window.mostrarClientes = mostrarClientes;
window.mostrarVentasCerradas = mostrarVentasCerradas;