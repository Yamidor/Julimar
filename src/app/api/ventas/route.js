import { NextResponse } from "next/server";
import { prisma } from "../../../libs/prisma";

export async function GET() {
  try {
    const ventas = await prisma.venta.findMany({
      include: {
        articulo: true,
      },
    });
    return NextResponse.json(ventas);
  } catch (error) {
    return NextResponse.json({ error: error.message });
  }
}
