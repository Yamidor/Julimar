import { NextResponse } from "next/server";
import { prisma } from "../../../libs/prisma";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

export async function GET() {
  try {
    const articulos = await prisma.articulo.findMany();
    return NextResponse.json(articulos);
  } catch (error) {
    return NextResponse.json({ error: error.message });
  }
}
export async function POST(request) {
  try {
    const formData = await request.formData();
    // Obtener los datos del formulario
    let codigo = formData.get("codigo");
    const nombre = formData.get("nombre");
    const tipo = "Producto";
    const descripcion = formData.get("descripcion");
    const precio_compra = parseFloat(formData.get("precio_compra"));
    const precio_venta = parseFloat(formData.get("precio_venta"));
    const codigo_barras = formData.get("codigo_barras");

    const imagenFile = formData.get("imagen");

    let imagen;
    if (imagenFile && imagenFile.size > 0) {
      imagen = `/uploads/${uuidv4()}-${imagenFile.name}`;
    } else {
      if (tipo === "Producto") {
        imagen = "/uploads/noproducto.jfif";
      } else {
        imagen = "/uploads/manodeobra.png";
      }
    }

    if (!codigo || !nombre || !tipo || !precio_compra || !precio_venta) {
      return NextResponse.json({
        error: "Todos los campos excepto imagen y descripción son obligatorios",
      });
    }

    // Guardar la foto si se proporcionó una imagen
    if (imagenFile && imagenFile.size > 0) {
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
    }

    const articulo = await prisma.articulo.create({
      data: {
        codigo,
        nombre,
        imagen,
        descripcion,
        tipo,
        precio_compra,
        precio_venta,
        codigo_barras,
      },
    });

    await prisma.inventario.create({
      data: {
        unidades: 0,
        articuloId: parseInt(articulo.id),
      },
    });

    return NextResponse.json({ success: true, articulo });
  } catch (error) {
    return NextResponse.json({ error: error.message });
  }
}
