// scraper.js
import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import fs from "fs";

function limpiarPrecio(precioRaw) {
  if (!precioRaw) return null;
  let limpio = precioRaw.replace(/[^\d,,-]/g, "");
  limpio = limpio.replace(",", ".");
  limpio = limpio.replace(/\.(?=\d{3})/g, "");
  const valor = parseFloat(limpio);
  return isNaN(valor) ? null : valor;
}

async function obtenerImagenDesdeDetalle(urlProducto) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(urlProducto, { waitUntil: "networkidle2" });

  let imagen = null;
  try {
    await page.waitForSelector("img", { timeout: 10000 });
    imagen = await page.evaluate(() => {
      // Caso principal: imagen con clase js-product-slide-img
      const el = document.querySelector("img.js-product-slide-img");
      if (el) {
        if (el.src) return el.src;
        if (el.getAttribute("data-src")) return el.getAttribute("data-src");
        if (el.getAttribute("srcset")) {
          const srcset = el.getAttribute("srcset");
          return srcset.split(",").pop().trim().split(" ")[0];
        }
      }

      // Caso alternativo: div con background-image
      const div = document.querySelector(".js-product-gallery div, .product-gallery div");
      if (div && div.style && div.style.backgroundImage) {
        return div.style.backgroundImage.replace(/url\(["']?(.*?)["']?\)/, "$1");
      }

      return null;
    });
  } catch (err) {
    console.warn("⚠️ Error al obtener imagen de detalle:", urlProducto);
  }

  await browser.close();
  return imagen;
}

export async function scrapeProductos() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto("https://cye2616.mitiendanube.com/productos/", {
    waitUntil: "networkidle2"
  });

  const html = await page.content();
  const $ = cheerio.load(html);

  let productos = [];

  const contenedores = $(".js-product-container");

  for (let i = 0; i < contenedores.length; i++) {
    const el = contenedores[i];
    const nombre = $(el).find(".js-item-name").text().trim();
    const precioRaw = $(el).find(".item-price-container").text().trim();
    const precio = limpiarPrecio(precioRaw);
    let urlProducto = $(el).find("a.item-link").attr("href");

    // Normalizar URL solo si existe
    if (urlProducto) {
      if (!urlProducto.startsWith("http")) {
        urlProducto = "https://cye2616.mitiendanube.com" + urlProducto;
      }

      let imagen = await obtenerImagenDesdeDetalle(urlProducto);

productos.push
    } else {
      console.warn("⚠️ Producto sin enlace válido:", nombre);
    }
  }

  await browser.close();
  return productos;
}

// Para pruebas directas
if (process.argv[1].includes("scraper.js")) {
  scrapeProductos().then(p => {
    console.log("✅ Productos obtenidos:", p.length);
    const sinImagen = p.filter(prod => !prod.img);
    console.log("🖼️ Sin imagen:", sinImagen.length);
  });
}