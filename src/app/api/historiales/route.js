import { NextResponse } from "next/server";
import { prisma } from "../../../libs/prisma";

export async function GET() {
  try {
    const facturas = await prisma.factura.findMany({
      include: {
        ventas: {
          include: {
            articulo: true, // Incluir el artículo relacionado con la venta
          },
        },
      },
    });
    return NextResponse.json(facturas);
  } catch (error) {
    return NextResponse.json({ error: error.message });
  }
}
