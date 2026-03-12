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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function limpiarPrecio(precioRaw) {
  if (!precioRaw) return null;
  let limpio = precioRaw.replace(/[^\d,,-]/g, "");
  limpio = limpio.replace(",", ".");
  limpio = limpio.replace(/\.(?=\d{3})/g, "");
  const valor = parseFloat(limpio);
  return isNaN(valor) ? null : valor;
}

export async function scrapeProductos() {
  const res = await fetch("https://cye2616.mitiendanube.com/productos/");
  const html = await res.text();
  const $ = cheerio.load(html);

  let count = 0;

  $(".js-product-container").each(async (i, el) => {
    const nombre = $(el).find(".js-item-name").text().trim();
    const precioRaw = $(el).find(".item-price-container").text().trim();
    const precio = limpiarPrecio(precioRaw);
    const urlProducto = $(el).find("a.item-link").attr("href");
    const imagen = $(el).find("img").attr("srcset") || $(el).find("img").attr("src");

    if (nombre && urlProducto) {
      const q = query(collection(db, "productos_scraper"), where("idProducto", "==", urlProducto));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        await addDoc(collection(db, "productos_scraper"), {
          idProducto: urlProducto,
          nombre,
          precio: precio ?? precioRaw,
          imagen: imagen || "N/A",
          fecha: new Date().toISOString(),
          origen: "scraper"
        });
        console.log(`✅ Guardado: ${nombre} - ${precioRaw} → ${precio}`);
        count++;
      } else {
        console.log(`⚠️ Ya existente: ${nombre}`);
      }
    }
  });

  console.log(`📁 Total productos procesados: ${count}`);
}

// Si querés que siga funcionando con "npm start", podés dejar esto:
if (process.argv[1].includes("scraper.js")) {
  scrapeProductos();
}