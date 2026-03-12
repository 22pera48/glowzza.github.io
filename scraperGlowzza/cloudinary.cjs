// cloudinary.cjs
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");

cloudinary.config({
  cloud_name: "duduckoiw",
  api_key: "774428935955832",
  api_secret: "7I-zSD7IHnlPqSM3L7poI2HhqkM"
});

async function subirImagenACloudinary(imgData, nombrePublico) {
  try {
    // Caso 1: URL pública
    if (imgData.startsWith("http")) {
      console.log("📤 Subiendo URL a Cloudinary:", imgData);
      const resultado = await cloudinary.uploader.upload(imgData, {
        public_id: nombrePublico,
        folder: "productos",
        overwrite: true   // 👈 agregado
      });
      return resultado.secure_url;
    }

    // Caso 2: Base64
    if (imgData.startsWith("data:image")) {
      console.log("📤 Subiendo base64 a Cloudinary...");
      const tempPath = path.join(__dirname, `${nombrePublico}.jpg`);
      const base64Image = imgData.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Image, "base64");
      fs.writeFileSync(tempPath, buffer);

      const resultado = await cloudinary.uploader.upload(tempPath, {
        public_id: nombrePublico,
        folder: "productos",
        overwrite: true   // 👈 agregado
      });

      fs.unlinkSync(tempPath);
      return resultado.secure_url;
    }

    throw new Error("Formato de imagen no soportado");
  } catch (error) {
    console.error("❌ Error al subir imagen a Cloudinary:", error);
    throw error;
  }
}

module.exports = { subirImagenACloudinary };