document.addEventListener("DOMContentLoaded", () => {
  const contenedor = document.getElementById("contenedorCarrito");
  const subtotalDiv = document.getElementById("subtotalCarrito");
  const totalDiv = document.getElementById("totalCarrito");
  let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

  function renderCarrito() {
    contenedor.innerHTML = "";
    if (carrito.length === 0) {
      contenedor.innerHTML = "<p>Tu carrito está vacío.</p>";
      subtotalDiv.textContent = "";
      totalDiv.textContent = "";
      return;
    }

    let subtotal = 0;
    const tabla = document.createElement("table");
    tabla.classList.add("tabla-carrito");

    tabla.innerHTML = `
      <thead>
        <tr>
          <th>Imagen</th>
          <th>Producto</th>
          <th>Precio</th>
          <th>Cantidad</th>
          <th>Subtotal</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${carrito.map((item, index) => {
          const sub = item.precio * item.cantidad;
          subtotal += sub;
          return `
            <tr>
              <td>${item.imagen ? `<img src="${item.imagen}" alt="${item.nombre}" class="img-carrito">` : ""}</td>
              <td>${item.nombre}</td>
              <td>$${item.precio}</td>
              <td>
                <input type="number" min="1" value="${item.cantidad}" 
                  data-index="${index}" class="cantidad-input">
              </td>
              <td>$${sub}</td>
              <td>
                <button class="btn-secundario eliminar-btn" data-index="${index}" aria-label="Eliminar ${item.nombre}">
                  Eliminar
                </button>
              </td>
            </tr>
          `;
        }).join("")}
      </tbody>
    `;

    contenedor.appendChild(tabla);
    subtotalDiv.textContent = `Subtotal: $${subtotal}`;
    totalDiv.textContent = `Total: $${subtotal}`;
  }

  // 🔹 Actualizar cantidad dinámicamente
  contenedor.addEventListener("change", (e) => {
    if (e.target.classList.contains("cantidad-input")) {
      const index = e.target.dataset.index;
      carrito[index].cantidad = Math.max(1, parseInt(e.target.value) || 1);
      localStorage.setItem("carrito", JSON.stringify(carrito));
      renderCarrito();
    }
  });

  // 🔹 Eliminar producto con animación
  contenedor.addEventListener("click", (e) => {
    if (e.target.classList.contains("eliminar-btn")) {
      const index = e.target.dataset.index;
      const fila = e.target.closest("tr");
      fila.style.transition = "opacity 0.5s";
      fila.style.opacity = "0";
      setTimeout(() => {
        carrito.splice(index, 1);
        localStorage.setItem("carrito", JSON.stringify(carrito));
        renderCarrito();
      }, 500);
    }
  });

  // 🔹 Vaciar carrito
  window.vaciarCarrito = () => {
    carrito = [];
    localStorage.removeItem("carrito");
    renderCarrito();
  };

  // 🔹 Finalizar compra → abre modal
  window.finalizarCompra = () => {
    document.getElementById("finalizarModal").style.display = "block";
  };

  // Render inicial
  renderCarrito();

  // 🔹 Listener para botón Cancelar del formulario
  const cancelarBtn = document.getElementById("cancelarBtn");
  if (cancelarBtn) {
    cancelarBtn.addEventListener("click", () => {
      // Oculta formulario y cierra modal
      document.getElementById("formCorreo").style.display = "none";
      document.getElementById("finalizarModal").style.display = "none";
    });
  }
});

// 🔹 Cerrar modal
function cerrarModal() {
  document.getElementById("finalizarModal").style.display = "none";
}

// 🔹 Finalizar con WhatsApp
function finalizarConWhatsApp() {
  let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
  let mensaje = "🌸✨ Glowzza ✨🌸\nTu carrito de belleza y cuidado personal 🛍️\n\n";
  let total = 0;
  carrito.forEach(item => {
    let sub = item.precio * item.cantidad;
    total += sub;
    mensaje += `▫️ ${item.nombre} x${item.cantidad} = $${sub}\n`;
  });
  mensaje += `\n💰 Total: $${total}\n🙌 Gracias por elegir Glowzza 💖`;
  let url = `https://wa.me/541171019084?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank");
}

// 🔹 Mostrar formulario correo
function mostrarFormulario() {
  document.getElementById("formCorreo").style.display = "block";
}

// 🔹 Enviar formulario correo
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formCorreo");
  const cancelarBtn = document.getElementById("cancelarBtn");

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const nombre = document.getElementById("nombreCorreo").value;
      const email = document.getElementById("emailCorreo").value;
      const telefono = document.getElementById("direccionCorreo").value;

      let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
      let resumen = "🛒 Pedido vía correo:\n";
      let total = 0;
      carrito.forEach(item => {
        let sub = item.precio * item.cantidad;
        total += sub;
        resumen += `• ${item.nombre} x${item.cantidad} = $${sub}\n`;
      });
      resumen += `\n💰 Total: $${total}\nCliente: ${nombre}\nEmail: ${email}\nTeléfono: ${telefono}`;

      Swal.fire({
        icon: 'success',
        title: 'Pedido enviado por correo',
        text: 'Gracias por elegir Glowzza 💖',
        timer: 2500,
        showConfirmButton: false
      });

      localStorage.removeItem("carrito");
      cerrarModal();
      setTimeout(() => location.href = "index2.html", 2500);
    });
  }

  // 🔹 Botón Cancelar → cierra modal entero
  if (cancelarBtn) {
    cancelarBtn.addEventListener("click", () => {
      document.getElementById("formCorreo").style.display = "none";
      document.getElementById("finalizarModal").style.display = "none";
    });
  }
});
