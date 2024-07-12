"use client";
import React, { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import BarcodeReader from "react-barcode-reader";

const MySwal = withReactContent(Swal);

const Factura = () => {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [factura, setFactura] = useState([]);
  const [numeroFactura, setNumeroFactura] = useState("");
  const [cliente, setCliente] = useState({
    nombre_cliente: "",
    dni_cliente: "",
    tipo_cliente: "Normal", // Default to "Normal"
  });

  useEffect(() => {
    fetchProductos();
    fetchNumeroFactura();
  }, []);

  const fetchProductos = () => {
    fetch("/api/inventarios")
      .then((response) => response.json())
      .then((data) => {
        const productosConUnidades = data.map((item) => ({
          ...item.articulo,
          unidades: item.unidades,
          inventarioId: item.id,
        }));
        setProductos(productosConUnidades);
      })
      .catch((error) => {
        console.error("Error al obtener los artículos:", error);
        toast.error("Error al obtener los artículos");
      });
  };

  const fetchNumeroFactura = async () => {
    try {
      const response = await fetch("/api/facturas");
      const data = await response.json();
      const nextNumber = data.numero
        ? `FAC-${String(parseInt(data.numero.split("-")[1]) + 1).padStart(
            7,
            "0"
          )}`
        : "FAC-0000001";
      setNumeroFactura(nextNumber);
    } catch (error) {
      console.error("Error al obtener el número de factura:", error);
      toast.error("Error al obtener el número de factura");
    }
  };

  const handleBuscar = (event) => {
    setBusqueda(event.target.value);
  };

  const agregarProducto = (producto) => {
    const productoEnFactura = factura.find(
      (item) => item.codigo === producto.codigo
    );
    const cantidadSolicitada = productoEnFactura
      ? productoEnFactura.cantidad + 1
      : 1;

    if (cantidadSolicitada > producto.unidades) {
      toast.error(
        `No hay suficientes unidades disponibles para ${producto.nombre}`
      );
      return;
    }

    if (productoEnFactura) {
      setFactura(
        factura.map((item) =>
          item.codigo === producto.codigo
            ? {
                ...item,
                cantidad: item.cantidad + 1,
                total: (item.cantidad + 1) * Number(item.precio_venta),
              }
            : item
        )
      );
    } else {
      setFactura([
        ...factura,
        { ...producto, cantidad: 1, total: Number(producto.precio_venta) },
      ]);
    }
  };

  const incrementarCantidad = (codigo) => {
    const productoEnFactura = factura.find((item) => item.codigo === codigo);
    const productoEnInventario = productos.find(
      (item) => item.codigo === codigo
    );

    if (productoEnFactura.cantidad + 1 > productoEnInventario.unidades) {
      toast.error(
        `No hay suficientes unidades disponibles para ${productoEnFactura.nombre}`
      );
      return;
    }

    setFactura(
      factura.map((item) =>
        item.codigo === codigo
          ? {
              ...item,
              cantidad: item.cantidad + 1,
              total: (item.cantidad + 1) * Number(item.precio_venta),
            }
          : item
      )
    );
  };

  const decrementarCantidad = (codigo) => {
    const producto = factura.find((item) => item.codigo === codigo);

    if (producto.cantidad > 1) {
      setFactura(
        factura.map((item) =>
          item.codigo === codigo
            ? {
                ...item,
                cantidad: item.cantidad - 1,
                total: (item.cantidad - 1) * Number(item.precio_venta),
              }
            : item
        )
      );
    } else {
      setFactura(factura.filter((item) => item.codigo !== codigo));
    }
  };

  const calcularSubTotal = () => {
    return factura.reduce(
      (total, item) => total + (Number(item.total) || 0),
      0
    );
  };

  const calcularImpuesto = () => {
    return cliente.tipo_cliente === "Normal" ? 0 : calcularSubTotal() * 0.19;
  };

  const calcularTotal = () => {
    return calcularSubTotal() + calcularImpuesto();
  };

  const validarCliente = () => {
    if (!cliente.nombre_cliente || !cliente.dni_cliente) {
      toast.error("Debe completar el nombre y DNI del cliente");
      return false;
    }
    return true;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const generarPDF = () => {
    if (!validarCliente()) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    const centerText = (text, y, fontSize = 10) => {
      doc.setFontSize(fontSize);
      const textWidth = doc.getTextWidth(text);
      const x = (pageWidth - textWidth) / 2;
      doc.text(text, x, y);
    };

    centerText(
      "Julimar P&G Dirección Calle 27a # 23-14 barrio Montesol la ceja Contacto: 3124872382 Correo: Maluxijutienda@gmail.com",
      10,
      9
    );
    centerText(
      `Factura: ${numeroFactura}, Cliente: ${cliente.nombre_cliente}, DNI: ${cliente.dni_cliente}`,
      15,
      9
    );

    doc.autoTable({
      startY: 20,
      head: [["Código", "Nombre", "Cantidad", "Precio de Venta", "Total"]],
      body: factura.map((item) => [
        item.codigo,
        item.nombre,
        item.cantidad,
        formatCurrency(item.precio_venta),
        formatCurrency(item.total),
      ]),
    });

    const finalY = doc.autoTable.previous.finalY;

    doc.setFontSize(10);
    doc.text(
      `Sub-Total: ${formatCurrency(calcularSubTotal())}`,
      15,
      finalY + 10
    );
    doc.text(
      `Impuesto: ${formatCurrency(calcularImpuesto())}`,
      15,
      finalY + 20
    );
    doc.text(`Total: ${formatCurrency(calcularTotal())}`, 15, finalY + 30);

    doc.save("factura.pdf");
  };

  const handlePagar = async () => {
    if (!validarCliente()) return;

    try {
      const response = await fetch("/api/facturas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre_cliente: cliente.nombre_cliente,
          dni_cliente: cliente.dni_cliente,
          tipo_cliente: cliente.tipo_cliente,
          numero: numeroFactura,
          sub_total: calcularSubTotal(),
          impuesto: calcularImpuesto(),
          total: calcularTotal(),
          ventas: factura.map((item) => ({
            articuloId: item.id,
            cantidad: item.cantidad,
            precio_compra: item.precio_compra, // Si está disponible en el item
            precio_venta: item.precio_venta,
            fecha: new Date(),
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Error al crear la factura");
      }

      toast.success("Factura creada exitosamente");
      setFactura([]);
      setCliente({
        nombre_cliente: "",
        dni_cliente: "",
        tipo_cliente: "Normal",
      });
      fetchNumeroFactura();
      fetchProductos(); // Actualiza la lista de productos
    } catch (error) {
      console.error("Error al crear la factura:", error);
      toast.error("Error al crear la factura");
    }
  };

  const productosFiltrados = productos.filter(
    (producto) =>
      producto.codigo.includes(busqueda) ||
      producto.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleBarcodeScan = (scannedBarcode) => {
    const producto = productos.find(
      (prod) => prod.codigo_barras === scannedBarcode
    );
    if (producto) {
      agregarProducto(producto);
      toast.success("Producto agregado a la factura.");
    } else {
      toast.error("Producto no encontrado.");
    }
  };

  return (
    <>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <Toaster richColors />
        <BarcodeReader
          onScan={handleBarcodeScan}
          onError={(err) => console.error(err)}
        />
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Facturación</h1>
          <button
            onClick={generarPDF}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Generar PDF
          </button>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Nombre del Cliente
          </label>
          <input
            type="text"
            value={cliente.nombre_cliente}
            onChange={(e) =>
              setCliente({ ...cliente, nombre_cliente: e.target.value })
            }
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Nombre del Cliente"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            DNI del Cliente
          </label>
          <input
            type="text"
            value={cliente.dni_cliente}
            onChange={(e) =>
              setCliente({ ...cliente, dni_cliente: e.target.value })
            }
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="DNI del Cliente"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Tipo de Cliente
          </label>
          <select
            value={cliente.tipo_cliente}
            onChange={(e) =>
              setCliente({ ...cliente, tipo_cliente: e.target.value })
            }
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="Normal">Normal</option>
            <option value="Exento de IVA">Exento de IVA</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Buscar Producto
          </label>
          <input
            type="text"
            value={busqueda}
            onChange={handleBuscar}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Buscar por código o nombre"
          />
        </div>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="lg:w-1/2">
            <h2 className="text-xl font-bold mb-2">Productos</h2>
            <ul className="overflow-y-auto h-96 border p-4">
              {productosFiltrados.map((producto) => (
                <li
                  key={producto.codigo}
                  className="flex justify-between items-center mb-2 p-2 border rounded hover:bg-gray-100 cursor-pointer"
                  onClick={() => agregarProducto(producto)}
                >
                  <span>{producto.nombre}</span>
                  <span>{formatCurrency(producto.precio_venta)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:w-1/2">
            <h2 className="text-xl font-bold mb-2">Factura</h2>
            <ul className="overflow-y-auto h-96 border p-4">
              {factura.map((item) => (
                <li
                  key={item.codigo}
                  className="flex justify-between items-center mb-2 p-2 border rounded"
                >
                  <div>
                    <span className="font-bold">{item.nombre}</span>
                    <div className="text-sm text-gray-600">
                      {formatCurrency(item.precio_venta)} x {item.cantidad}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={() => decrementarCantidad(item.codigo)}
                      className="bg-red-500 text-white px-2 py-1 rounded-l"
                    >
                      -
                    </button>
                    <span className="px-2">{item.cantidad}</span>
                    <button
                      onClick={() => incrementarCantidad(item.codigo)}
                      className="bg-green-500 text-white px-2 py-1 rounded-r"
                    >
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 p-4 border rounded">
              <div className="flex justify-between mb-2">
                <span className="font-bold">Sub-Total:</span>
                <span>{formatCurrency(calcularSubTotal())}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-bold">Impuesto:</span>
                <span>{formatCurrency(calcularImpuesto())}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-bold">Total:</span>
                <span>{formatCurrency(calcularTotal())}</span>
              </div>
              <button
                onClick={handlePagar}
                className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Pagar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Factura;
