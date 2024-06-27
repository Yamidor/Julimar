import { NextResponse } from "next/server";
import { prisma } from "../../../../libs/prisma.js";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

export async function PUT(request, { params }) {
  try {
    const formData = await request.formData();
    const id = formData.get("id");
    const codigo = formData.get("codigo");
    const nombre = formData.get("nombre");
    const tipo = "Producto";
    const descripcion = formData.get("descripcion");
    const precio_compra = parseFloat(formData.get("precio_compra"));
    const precio_venta = parseFloat(formData.get("precio_venta"));

    const imagenFile = formData.get("imagen");

    let imagen;
    if (imagenFile && imagenFile.size > 0) {
      imagen = `/uploads/${uuidv4()}-${imagenFile.name}`;
      const reader = imagenFile.stream().getReader();
      const writer = fs.createWriteStream(`public${imagen}`);
      const pump = async () => {
        const { value, done } = await reader.read();
        if (done) {
          writer.close();
          return;
        }
        writer.write(value);
        return pump();
      };
      await pump();
    } else {
      const articulo = await prisma.articulo.findUnique({
        where: { id: parseInt(id) },
      });
      imagen = articulo.imagen;
    }

    if (!codigo || !nombre || !tipo || !precio_compra || !precio_venta) {
      return NextResponse.json({
        error: "Todos los campos excepto imagen y descripción son obligatorios",
      });
    }

    const updatedArticulo = await prisma.articulo.update({
      where: { id: Number(params.id) },
      data: {
        codigo,
        nombre,
        descripcion,
        tipo: "Producto",
        precio_compra,
        precio_venta,
        imagen,
      },
    });
    return NextResponse.json({ success: true, articulo: updatedArticulo });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: error.message });
  }
}
