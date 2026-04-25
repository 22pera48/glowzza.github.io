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
              <td><img src="${item.imagen}" alt="${item.nombre}" class="img-carrito"></td>
              <td>${item.nombre}</td>
              <td>$${item.precio}</td>
              <td>
                <input type="number" min="1" value="${item.cantidad}" 
                  data-index="${index}" class="cantidad-input">
              </td>
              <td>$${sub}</td>
              <td><button class="btn-secundario eliminar-btn" data-index="${index}">Eliminar</button></td>
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

