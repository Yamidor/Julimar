"use client";
import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  Title,
} from "chart.js";
import { Pie } from "react-chartjs-2";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  Title
);

const Balance = () => {
  const [compras, setCompras] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [fechaInicio, setFechaInicio] = useState(new Date());
  const [fechaFin, setFechaFin] = useState(new Date());

  useEffect(() => {
    fetchCompras();
    fetchVentas();
  }, []);

  const fetchCompras = async () => {
    await fetch("/api/compras")
      .then((response) => response.json())
      .then((data) => setCompras(data))
      .catch((error) => console.error("Error fetching compras:", error));
  };

  const fetchVentas = () => {
    fetch("/api/ventas")
      .then((response) => response.json())
      .then((data) => setVentas(data))
      .catch((error) => console.error("Error fetching ventas:", error));
  };

  const filtrarPorFecha = (items) => {
    const inicio = new Date(fechaInicio).setHours(0, 0, 0, 0);
    const fin = new Date(fechaFin).setHours(23, 59, 59, 999);
    return items.filter((item) => {
      const fechaItem = new Date(item.fecha).getTime();
      return fechaItem >= inicio && fechaItem <= fin;
    });
  };

  const comprasFiltradas = filtrarPorFecha(compras);
  const ventasFiltradas = filtrarPorFecha(ventas);

  const calcularInventario = () => {
    const inventario = comprasFiltradas.reduce((acc, compra) => {
      acc[compra.articulo.codigo] =
        (acc[compra.articulo.codigo] || 0) +
        compra.cantidad * compra.valor_unidad;
      return acc;
    }, {});

    ventasFiltradas.forEach((venta) => {
      inventario[venta.articulo.codigo] =
        (inventario[venta.articulo.codigo] || 0) -
        venta.cantidad * venta.precio_compra;
    });

    return inventario;
  };

  const calcularGanancias = () => {
    const gananciasPorArticulo = ventasFiltradas.reduce((acc, venta) => {
      const key = venta.articulo.codigo;
      const compra = compras.find((compra) => compra.articulo.codigo === key);
      const precioCompra = compra ? compra.total / compra.cantidad : 0;
      const ganancia = (venta.precio_venta - precioCompra) * venta.cantidad;

      if (!acc[key]) {
        acc[key] = {
          ...venta.articulo,
          cantidad: 0,
          totalGanancia: 0,
        };
      }
      acc[key].cantidad += venta.cantidad;
      acc[key].totalGanancia += ganancia;

      return acc;
    }, {});

    const totalGanancias = Object.values(gananciasPorArticulo).reduce(
      (acc, item) => acc + item.totalGanancia,
      0
    );

    return { totalGanancias, gananciasPorArticulo };
  };

  const { totalGanancias, gananciasPorArticulo } = calcularGanancias();
  const inventario = calcularInventario();

  const formatearPesos = (valor) => {
    const num = Number(valor);
    if (isNaN(num)) return "$ 0";
    return `$ ${num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
  };

  const generarPDF = () => {
    const doc = new jsPDF();

    doc.text("Informe de Ventas y Ganancias", 14, 16);

    doc.autoTable({
      head: [["Código", "Nombre", "Cantidad", "Precio Venta", "Total"]],
      body: Object.values(gananciasPorArticulo).map((item) => [
        item.codigo,
        item.nombre,
        item.cantidad,
        formatearPesos(item.precio_venta),
        formatearPesos(item.precio_venta * item.cantidad),
      ]),
      startY: 20,
    });

    doc.text(
      `Total Ventas: ${formatearPesos(
        ventasFiltradas.reduce(
          (total, item) => total + item.precio_venta * item.cantidad,
          0
        )
      )}`,
      14,
      doc.previousAutoTable.finalY + 10
    );
    doc.text(
      `Ganancias: ${formatearPesos(totalGanancias)}`,
      14,
      doc.previousAutoTable.finalY + 20
    );

    doc.autoTable({
      head: [["Código", "Nombre", "Cantidad en Inventario"]],
      body: Object.entries(inventario).map(([codigo, valorInventario]) => {
        const compra = compras.find(
          (compra) => compra.articulo.codigo === codigo
        );
        const nombre = compra ? compra.articulo.nombre : "Desconocido";
        return [codigo, nombre, formatearPesos(valorInventario)];
      }),
      startY: doc.previousAutoTable.finalY + 30,
    });

    doc.text(
      `Valor Inventario: ${formatearPesos(
        Object.values(inventario).reduce((a, b) => a + b, 0)
      )}`,
      14,
      doc.previousAutoTable.finalY + 40
    );

    doc.save("informe_balance.pdf");
  };

  const data = {
    labels: ["Inventario", "Ventas", "Ganancias"],
    datasets: [
      {
        data: [
          Object.values(inventario).reduce((a, b) => a + b, 0),
          ventasFiltradas.reduce(
            (total, item) => total + item.precio_venta * item.cantidad,
            0
          ),
          totalGanancias,
        ],
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
        hoverBackgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
  };
  return (
    <div className="container mx-auto p-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Balance de Ventas y Ganancias</h1>
      <div className="flex mb-4">
        <div className="mr-2">
          <label>Fecha Inicio</label>
          <DatePicker
            selected={fechaInicio}
            onChange={(date) => setFechaInicio(date)}
            dateFormat="yyyy-MM-dd"
            className="border p-2 text-center text-black"
          />
        </div>
        <div>
          <label>Fecha Fin</label>
          <DatePicker
            selected={fechaFin}
            onChange={(date) => setFechaFin(date)}
            dateFormat="yyyy-MM-dd"
            className="border p-2 text-center text-black"
          />
        </div>
      </div>
      <div className="w-1/2 h-96">
        <Pie data={data} options={options} />
      </div>
      <button
        onClick={generarPDF}
        className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
      >
        Generar PDF
      </button>
    </div>
  );
};

export default Balance;
