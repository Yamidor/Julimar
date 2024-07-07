"use client";
import React, { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faMinus, faEdit } from "@fortawesome/free-solid-svg-icons";
import "../../libs/icons";

const Stock = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [inventarios, setInventarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const articulosPerPage = 8;
  const alertThreshold = 2; // Umbral de unidades para la alerta

  async function loadInventarios() {
    const response = await fetch("/api/inventarios");
    const inventarios = await response.json();
    return inventarios.filter(
      (inventario) =>
        inventario.articulo.nombre
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        inventario.articulo.codigo.includes(searchTerm)
    );
  }

  useEffect(() => {
    const fetchData = async () => {
      const dataArticulos = await loadInventarios();
      setInventarios(dataArticulos);
    };

    fetchData();
  }, [searchTerm]);

  const updateStock = async (articuloId, cantidad, increment = true) => {
    const inventario = inventarios.find(
      (inv) => inv.articulo.id === articuloId
    );

    if (!increment && inventario.unidades <= 0) {
      toast.error("No se puede decrementar más. El stock está en cero.");
      return;
    }

    const response = await fetch(`/api/inventarios`, {
      method: increment ? "POST" : "PUT",
      body: JSON.stringify({ articuloId, cantidad }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      toast.success("Inventario actualizado correctamente");
      const dataArticulos = await loadInventarios();
      setInventarios(dataArticulos);
    } else {
      toast.error("Error al actualizar el inventario");
    }
  };

  const handleClickPrev = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleClickNext = () => {
    if ((currentPage + 1) * articulosPerPage < inventarios.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <Toaster richColors />
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">Inventario</h1>
          </div>
          <div className="flex items-center">
            <input
              type="text"
              className="border text-black border-gray-300 px-3 py-2 mr-2"
              placeholder="Buscar Codigo o por nombre..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {inventarios
            .slice(
              currentPage * articulosPerPage,
              (currentPage + 1) * articulosPerPage
            )
            .map((inventario) => (
              <div
                key={inventario.id}
                className={`p-4 border rounded-lg relative hover:bg-white hover:text-gray-600 cursor-pointer ${
                  inventario.unidades <= alertThreshold ? "bg-red-500" : ""
                }`}
              >
                <div className="absolute top-0 left-0 p-2">
                  <h1 className="text-xl font-bold">{inventario.unidades}</h1>
                </div>
                <div className="absolute top-0 right-0 p-2 flex space-x-2">
                  <FontAwesomeIcon
                    className="bg-yellow-500 text-white px-2 py-1 rounded"
                    onClick={() =>
                      updateStock(inventario.articulo.id, 1, false)
                    }
                    icon={faMinus}
                  />
                  <FontAwesomeIcon
                    className="bg-blue-500 text-white px-2 py-1 rounded"
                    onClick={() => updateStock(inventario.articulo.id, 1, true)}
                    icon={faPlus}
                  />
                </div>
                <img
                  className="w-20 h-20 rounded-full mx-auto mb-4"
                  src={
                    inventario.articulo.imagen
                      ? inventario.articulo.imagen
                      : "/uploads/noproducto.jfif"
                  }
                  alt={inventario.articulo.nombre}
                />
                <div className="text-center">
                  <h2 className="text-lg font-semibold mb-2">
                    {inventario.articulo.nombre}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Código: {inventario.articulo.codigo}
                  </p>
                  <p className="text-sm text-gray-600">
                    Precio venta: ${inventario.articulo.precio_venta}
                  </p>
                  <p className="text-sm text-gray-600">
                    Precio compra: ${inventario.articulo.precio_compra}
                  </p>
                  <p className="text-sm text-gray-600">
                    Tipo: {inventario.articulo.tipo}
                  </p>
                </div>
              </div>
            ))}
        </div>
        <div className="flex justify-between mt-4">
          <button
            onClick={handleClickPrev}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-black rounded disabled:opacity-50"
            disabled={currentPage === 0}
          >
            Anterior
          </button>
          <button
            onClick={handleClickNext}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-black rounded disabled:opacity-50"
            disabled={
              (currentPage + 1) * articulosPerPage >= inventarios.length
            }
          >
            Siguiente
          </button>
        </div>
      </div>
    </>
  );
};

export default Stock;
