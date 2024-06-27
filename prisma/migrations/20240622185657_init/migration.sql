-- CreateTable
CREATE TABLE "Inventario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "articuloId" INTEGER NOT NULL,
    "unidades" INTEGER NOT NULL,
    CONSTRAINT "Inventario_articuloId_fkey" FOREIGN KEY ("articuloId") REFERENCES "Articulo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Articulo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "imagen" TEXT,
    "descripcion" TEXT,
    "tipo" TEXT NOT NULL,
    "precio_compra" DECIMAL NOT NULL DEFAULT 0.0,
    "precio_venta" DECIMAL NOT NULL DEFAULT 0.0
);

-- CreateTable
CREATE TABLE "Venta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "articuloId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_compra" DECIMAL NOT NULL DEFAULT 0.0,
    "precio_venta" DECIMAL NOT NULL DEFAULT 0.0,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "facturaId" INTEGER NOT NULL,
    CONSTRAINT "Venta_articuloId_fkey" FOREIGN KEY ("articuloId") REFERENCES "Articulo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Venta_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Factura" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre_cliente" TEXT NOT NULL,
    "dni_cliente" TEXT NOT NULL,
    "tipo_cliente" TEXT NOT NULL,
    "numero" TEXT NOT NULL DEFAULT '',
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sub_total" DECIMAL NOT NULL DEFAULT 0.0,
    "impuesto" DECIMAL NOT NULL DEFAULT 0.0,
    "total" DECIMAL NOT NULL DEFAULT 0.0
);

-- CreateTable
CREATE TABLE "Compra" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "articuloId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "valor_unidad" DECIMAL NOT NULL DEFAULT 0.0,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo_pago" TEXT NOT NULL,
    "pagado" BOOLEAN NOT NULL,
    "total" DECIMAL NOT NULL DEFAULT 0.0,
    CONSTRAINT "Compra_articuloId_fkey" FOREIGN KEY ("articuloId") REFERENCES "Articulo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Inventario_articuloId_key" ON "Inventario"("articuloId");

-- CreateIndex
CREATE UNIQUE INDEX "Articulo_codigo_key" ON "Articulo"("codigo");
