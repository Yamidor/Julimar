"use client";
import React, { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

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

  return (
    <>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <Toaster richColors />
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">Factura</h1>
            <h2>{numeroFactura}</h2>
          </div>
          <div className="flex items-center">
            <input
              type="text"
              className="border text-black border-gray-300 px-3 py-2 mr-2"
              placeholder="Buscar producto por código o nombre..."
              value={busqueda}
              onChange={handleBuscar}
            />
          </div>
        </div>
        <div className="mb-4">
          <h2 className="text-xl font-bold">Cliente</h2>
          <div className="flex space-x-4">
            <input
              type="text"
              className="border text-black border-gray-300 px-3 py-2"
              placeholder="Nombre del Cliente"
              value={cliente.nombre_cliente}
              onChange={(e) =>
                setCliente({ ...cliente, nombre_cliente: e.target.value })
              }
            />
            <input
              type="text"
              className="border text-black border-gray-300 px-3 py-2"
              placeholder="DNI del Cliente"
              value={cliente.dni_cliente}
              onChange={(e) =>
                setCliente({ ...cliente, dni_cliente: e.target.value })
              }
            />
            <select
              className="border text-black border-gray-300 px-3 py-2"
              value={cliente.tipo_cliente}
              onChange={(e) =>
                setCliente({ ...cliente, tipo_cliente: e.target.value })
              }
            >
              <option value="Normal">Normal</option>
              <option value="VIP">VIP</option>
              <option value="Empresa">Empresa</option>
            </select>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ width: "45%" }}>
            <h2>Productos</h2>
            <ul>
              {productosFiltrados.map((producto) => (
                <li
                  key={producto.codigo}
                  className="mb-2 flex justify-between items-center"
                >
                  <span className="flex items-center">
                    <img
                      src={producto.imagen}
                      alt={producto.nombre}
                      className="w-10 h-10 rounded-full mr-2"
                    />
                    {producto.nombre} - {formatCurrency(producto.precio_venta)}
                  </span>
                  <button
                    onClick={() => agregarProducto(producto)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ml-4"
                  >
                    Agregar
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ width: "45%" }}>
            <h2>Factura {numeroFactura}</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2">Código</th>
                  <th className="border p-2">Nombre</th>
                  <th className="border p-2">Cantidad</th>
                  <th className="border p-2">Precio de Venta</th>
                  <th className="border p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {factura.map((item) => (
                  <tr key={item.codigo}>
                    <td className="border p-2">{item.codigo}</td>
                    <td className="border p-2">{item.nombre}</td>
                    <td className="border p-2">
                      <div className="flex items-center">
                        <button
                          onClick={() => decrementarCantidad(item.codigo)}
                          className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          -
                        </button>
                        <span className="mx-2">{item.cantidad}</span>
                        <button
                          onClick={() => incrementarCantidad(item.codigo)}
                          className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="border p-2">
                      {formatCurrency(item.precio_venta)}
                    </td>
                    <td className="border p-2">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h3 className="mt-4 text-lg font-bold">
              Sub-Total: {formatCurrency(calcularSubTotal())}
            </h3>
            <h3 className="mt-4 text-lg font-bold">
              Impuesto: {formatCurrency(calcularImpuesto())}
            </h3>
            <h3 className="mt-4 text-lg font-bold">
              Total: {formatCurrency(calcularTotal())}
            </h3>
            <div className="flex">
              <button
                onClick={generarPDF}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
              >
                Generar Factura
              </button>
              <button
                onClick={handlePagar}
                className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
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
