import express from "express";
import cors from "cors";
import { scrapeProductos } from "./scraper.js";
import { v2 as cloudinary } from "cloudinary";
import fetch from "node-fetch";

const app = express();

// Configuración de Cloudinary con tus credenciales
cloudinary.config({
  cloud_name: "duduckoiw",
  api_key: "774428935955832",
  api_secret: "7I-zSD7IHnlPqSM3L7poI2HhqkM"
});

// Habilitar CORS solo para tu dominio
app.use(cors({
  origin: "https://glowzza.com.ar"
}));

// Función para subir imagen a Cloudinary
async function subirImagenACloudinary(urlImagen, nombre) {
  const res = await fetch(urlImagen);
  const buffer = await res.buffer();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { public_id: nombre, folder: "scraperGlowzza" },
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
    // Ejecutar el scraper y obtener productos
    const productos = await scrapeProductos();

    // Subir cada imagen a Cloudinary
    for (const producto of productos) {
      if (producto.img) {
        const urlCloudinary = await subirImagenACloudinary(producto.img, producto.nombre);
        producto.img = urlCloudinary; // reemplazar URL original por la de Cloudinary
      }
    }

    // Devolver productos con imágenes ya en Cloudinary
    res.json({ mensaje: "✅ Scraper ejecutado y fotos subidas", productos });
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Error al ejecutar el scraper");
  }
});

// Levantar servidor en puerto 3000
app.listen(3000, () => console.log("Servidor corriendo en puerto 3000"));
async function subirImagenACloudinary(urlImagen, nombre) {
  const res = await fetch(urlImagen);
  const buffer = await res.buffer();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { public_id: nombre, folder: "scraperGlowzza" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url); // URL pública de Cloudinary
      }
    );
    uploadStream.end(buffer);
  });
}
