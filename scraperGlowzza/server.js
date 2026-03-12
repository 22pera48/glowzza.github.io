import express from "express";
import cors from "cors";
import { scrapeProductos } from "./scraper.js";
import { v2 as cloudinary } from "cloudinary";
import fetch from "node-fetch";
import admin from "firebase-admin";
import serviceAccount from "./serviceAccountKey.json"; // tu clave de servicio

const app = express();

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: "duduckoiw",
  api_key: "774428935955832",
  api_secret: "7I-zSD7IHnlPqSM3L7poI2HhqkM"
});

// Configuración de Firestore
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Habilitar CORS solo para tu dominio
app.use(cors({
  origin: ["https://glowzza.com.ar", "http://localhost:3000"]
}));

// Función para subir imagen a Cloudinary
async function subirImagenACloudinary(urlImagen, nombre) {
  const res = await fetch(urlImagen);
  const buffer = await res.buffer();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { public_id: nombre, folder: "scraperGlowzza", overwrite: true },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url); // URL pública de Cloudinary
      }
    );
    uploadStream.end(buffer);
  });
}

// Endpoint que dispara el scraper manualmente
app.post("/ejecutar-scraper", async (req, res) => {
  try {
    const productos = await scrapeProductos();

    for (const producto of productos) {
      if (producto.img) {
        const nombreId = producto.nombre.replace(/\s+/g, "_").toLowerCase();
        const urlCloudinary = await subirImagenACloudinary(producto.img, nombreId);
        producto.img = urlCloudinary;

        // Guardar/actualizar en Firestore
        await db.collection("scraper").doc(nombreId).set(producto, { merge: true });
      }
    }

    res.json({ mensaje: "✅ Scraper ejecutado, fotos subidas y Firestore actualizado", productos });
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Error al ejecutar el scraper");
  }
});

// Levantar servidor en puerto 3000
app.listen(3000, () => console.log("Servidor corriendo en puerto 3000"));