"use client";
import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const Historial = () => {
  const [historiales, setHistoriales] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    fetchHistoriales();
  }, []);

  const fetchHistoriales = async () => {
    try {
      const response = await fetch("/api/historiales");
      const data = await response.json();
      setHistoriales(data);
    } catch (error) {
      console.error("Error al obtener historiales:", error);
    }
  };

  const handleBuscar = (event) => {
    setBusqueda(event.target.value);
  };

  const generarPDF = (historial) => {
    const doc = new jsPDF();

    // Headers
    doc.text(`Factura: ${historial.numero}`, 15, 10);
    doc.text(`Cliente: ${historial.nombre_cliente}`, 15, 20);
    doc.text(`DNI: ${historial.dni_cliente}`, 15, 30);

    // Table
    doc.autoTable({
      startY: 40,
      head: [["Código", "Nombre", "Cantidad", "Precio de Venta", "Total"]],
      body: historial.ventas.map((venta) => [
        venta.articulo.codigo,
        venta.articulo.nombre,
        venta.cantidad,
        venta.precio_venta,
        (venta.cantidad * venta.precio_venta).toFixed(2),
      ]),
    });

    // Totals
    const finalY = doc.autoTable.previous.finalY;
    doc.text(`Sub-Total: ${historial.sub_total}`, 15, finalY + 10);
    doc.text(`Impuesto: ${historial.impuesto}`, 15, finalY + 20);
    doc.text(`Total: ${historial.total}`, 15, finalY + 30);

    doc.save(`factura_${historial.numero}.pdf`);
  };

  const filtrarHistoriales = () => {
    return historiales.filter(
      (historial) =>
        historial.numero.includes(busqueda) ||
        historial.nombre_cliente.toLowerCase().includes(busqueda.toLowerCase())
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Historial de Facturas</h1>
        </div>
        <div className="flex items-center">
          <input
            type="text"
            className="border text-black border-gray-300 px-3 py-2 mr-2"
            placeholder="Buscar por número de factura o nombre de cliente..."
            value={busqueda}
            onChange={handleBuscar}
          />
        </div>
      </div>
      <div className="mb-4">
        {filtrarHistoriales().map((historial) => (
          <div key={historial.id} className="mb-4 border p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold">
                  Factura: {historial.numero} - Cliente:{" "}
                  {historial.nombre_cliente}
                </p>
                <p>Fecha: {new Date(historial.fecha).toLocaleDateString()}</p>
              </div>
              <div>
                <button
                  onClick={() => generarPDF(historial)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Imprimir
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Historial;
