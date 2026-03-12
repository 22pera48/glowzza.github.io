// scraper.js

import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { firebaseConfig } from "./firebaseConfig.js";
import { v2 as cloudinary } from "cloudinary";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: "duduckoiw",
  api_key: "774428935955832",
  api_secret: "7I-zSD7IHnlPqSM3L7poI2HhqkM"
});

// Limpieza de precios
function limpiarPrecio(precioRaw) {
  if (!precioRaw) return null;
  let limpio = precioRaw.replace(/[^\d,,-]/g, "");
  limpio = limpio.replace(",", ".");
  limpio = limpio.replace(/\.(?=\d{3})/g, "");
  const valor = parseFloat(limpio);
  return isNaN(valor) ? null : valor;
}

// Subir imagen a Cloudinary
async function subirImagenACloudinary(urlImagen, nombreId) {
  const res = await fetch(urlImagen);
  const buffer = await res.buffer();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { public_id: nombreId, folder: "productos_scraper", overwrite: true },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
}

export async function scrapeProductos() {
  const res = await fetch("https://cye2616.mitiendanube.com/productos/");
  const html = await res.text();
  const $ = cheerio.load(html);

  let count = 0;
  const resultados = [];
  const contenedores = $(".js-product-container").toArray();

  for (const el of contenedores) {
    const nombre = $(el).find(".js-item-name").text().trim();
    const precioRaw = $(el).find(".item-price-container").text().trim();
    const precio = limpiarPrecio(precioRaw);
    const urlProducto = $(el).find("a.item-link").attr("href");

    // Apuntador de imagen corregido: tomar la última URL del srcset
    let imagen = null;
    const srcset = $(el).find("img").attr("data-srcset") || $(el).find("img").attr("srcset");

    if (srcset) {
      const partes = srcset.split(",");
      imagen = partes[partes.length - 1].trim().split(" ")[0]; // última URL = mayor resolución
    } else {
      imagen = $(el).find("img").attr("data-src") || $(el).find("img").attr("src");
    }

    if (imagen && imagen.startsWith("//")) {
      imagen = "https:" + imagen;
    }

    if (nombre && urlProducto) {
      const q = query(collection(db, "productos_scraper"), where("idProducto", "==", urlProducto));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        let urlCloudinary = null;
        if (imagen) {
          try {
            const nombreId = nombre.replace(/\s+/g, "_").toLowerCase();
            urlCloudinary = await subirImagenACloudinary(imagen, nombreId);
          } catch (err) {
            console.warn("⚠️ Error al subir a Cloudinary:", err);
          }
        }

        await addDoc(collection(db, "productos_scraper"), {
          idProducto: urlProducto,
          nombre,
          precio: precio ?? precioRaw,
          imagen: urlCloudinary || imagen || "N/A",
          fecha: new Date().toISOString(),
          origen: "scraper"
        });

        resultados.push({
          Estado: "Nuevo",
          Nombre: nombre,
          Precio: precio ?? precioRaw,
          Imagen: urlCloudinary || imagen || "N/A"
        });
        count++;
      } else {
        resultados.push({
          Estado: "Existente",
          Nombre: nombre,
          Precio: precio ?? precioRaw,
          Imagen: imagen || "N/A"
        });
      }
    }
  }

  console.log("====================================");
  console.table(resultados);
  console.log("====================================");
  console.log(`📁 Total productos procesados: ${count}`);
}

// Para correr directo con `node scraper.js`
if (process.argv[1].includes("scraper.js")) {
  scrapeProductos();
}