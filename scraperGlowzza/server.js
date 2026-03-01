import express from "express";
import cors from "cors";
import { scrapeProductos } from "./scraper.js";

const app = express();

// Habilitar CORS solo para tu dominio
app.use(cors({
  origin: "https://glowzza.com.ar"
}));

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