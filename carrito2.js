document.addEventListener("DOMContentLoaded", () => {
  const contenedor = document.getElementById("contenedorCarrito");
  const totalDiv = document.getElementById("totalCarrito");

  let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

  function renderCarrito() {
    contenedor.innerHTML = "";
    if (carrito.length === 0) {
      contenedor.innerHTML = "<p>Tu carrito está vacío.</p>";
      totalDiv.textContent = "";
      return;
    }

    let total = 0;
    const tabla = document.createElement("table");
    tabla.classList.add("tabla-carrito");

    tabla.innerHTML = `
      <thead>
        <tr>
          <th>Producto</th>
          <th>Precio</th>
          <th>Cantidad</th>
          <th>Subtotal</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${carrito.map((item, index) => {
          const subtotal = item.precio * item.cantidad;
          total += subtotal;
          return `
            <tr>
              <td>${item.nombre}</td>
              <td>$${item.precio}</td>
              <td>
                <input type="number" min="1" value="${item.cantidad}" 
                  data-index="${index}" class="cantidad-input">
              </td>
              <td>$${subtotal}</td>
              <td><button class="btn-secundario eliminar-btn" data-index="${index}">Eliminar</button></td>
            </tr>
          `;
        }).join("")}
      </tbody>
    `;

    contenedor.appendChild(tabla);
    totalDiv.textContent = `Total: $${total}`;
  }

  // 🔹 Actualizar cantidad dinámicamente
  contenedor.addEventListener("change", (e) => {
    if (e.target.classList.contains("cantidad-input")) {
      const index = e.target.dataset.index;
      carrito[index].cantidad = parseInt(e.target.value);
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

  // 🔹 Finalizar compra
  window.finalizarCompra = () => {
    Swal.fire({
      icon: 'success',
      title: '¡Compra finalizada!',
      text: 'Gracias por elegir Glowzza 💖',
      timer: 2000,
      showConfirmButton: false
    });
    carrito = [];
    localStorage.removeItem("carrito");
    setTimeout(() => location.href = "index2.html", 2000);
  };

  // Render inicial
  renderCarrito();
});

