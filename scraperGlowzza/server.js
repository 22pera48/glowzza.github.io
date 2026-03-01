import express from "express";
import { scrapeProductos } from "./scraper.js"; // tu función de scraping

const app = express();

// Endpoint que dispara el scraper manualmente
app.post("/ejecutar-scraper", async (req, res) => {
  try {
    await scrapeProductos();
    res.send("✅ Scraper ejecutado manualmente");
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Error al ejecutar el scraper");
  }
});

// Levantar servidor en puerto 3000
app.listen(3000, () => console.log("Servidor corriendo en puerto 3000"));