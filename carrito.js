// Recuperar productos del localStorage
const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
const lista = document.getElementById("lista-carrito");
const total = document.getElementById("total-carrito");

let suma = 0;
carrito.forEach(producto => {
  const item = document.createElement("div");
  item.className = "item-carrito";
  item.innerHTML = `<p>${producto.nombre}</p><p>$${producto.precio}</p>`;
  lista.appendChild(item);
  suma += producto.precio;
});

total.textContent = suma;

function continuarCompra() {
  alert("Gracias por tu compra. Pronto te contactaremos por WhatsApp.");
  // Aquí podrías redirigir a WhatsApp o mostrar un formulario
}