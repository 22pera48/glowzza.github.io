// scraper-cli.cjs
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// Inicializar Firebase con Firestore
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Importar tus funciones de scraper y Cloudinary
const { scrapeProductos } = require("./scraper.js");
const { subirImagenACloudinary } = require("./cloudinary.cjs");

(async () => {
  try {
    console.log("🚀 Ejecutando scraper...");
    const productos = await scrapeProductos();

    if (!productos || productos.length === 0) {
      console.log("⚠️ No se encontraron productos.");
      return;
    }

    console.log("✅ Productos obtenidos:", productos.length);

    for (const producto of productos) {
      try {
        console.log("🔎 Imagen original:", producto.img);

        if (producto.img) {
          console.log("📤 Intentando subir a Cloudinary...");
          const urlCloudinary = await subirImagenACloudinary(producto.img, producto.nombre);
          console.log("📤 URL Cloudinary obtenida:", urlCloudinary);
          producto.img = urlCloudinary;
        }

// Generar un ID único basado en el nombre
const docId = producto.nombre.replace(/\s+/g, "_").toLowerCase();

// Guardar/actualizar en Firestore con ese ID
await db.collection("scraper").doc(docId).set(producto, { merge: true });
console.log(`📦 Guardado/actualizado en Firestore (scraper): ${producto.nombre}`);
      } catch (err) {
        console.error(`❌ Error con producto ${producto.nombre}:`, err);
      }
    }

    console.log("🎉 Scraper terminado. Productos subidos a Cloudinary y guardados en colección scraper.");
  } catch (err) {
    console.error("❌ Error general en scraper:", err);
  }
})();