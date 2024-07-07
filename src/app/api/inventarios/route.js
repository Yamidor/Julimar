import { NextResponse } from "next/server";
import { prisma } from "../../../libs/prisma";

export async function POST(request) {
  const data = await request.json();

  try {
    const result = await prisma.inventario.update({
      where: { articuloId: data.articuloId },
      data: { unidades: { increment: data.cantidad } },
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message });
  }
}

export async function PUT(request) {
  const data = await request.json();

  try {
    const result = await prisma.inventario.update({
      where: { articuloId: data.articuloId },
      data: { unidades: { decrement: data.cantidad } },
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message });
  }
}

export async function GET(request) {
  try {
    const inventarios = await prisma.inventario.findMany({
      include: {
        articulo: true,
      },
    });
    return NextResponse.json(inventarios);
  } catch (error) {
    console.error("Error al obtener el inventario:", error);
    return NextResponse.json({
      error: "Error al obtener el inventario",
    });
  }
}
