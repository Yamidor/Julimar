"use client";
import React, { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
const MySwal = withReactContent(Swal);

const Articulos = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [articulos, setArticulos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const articulosPerPage = 8;

  const getNextCodigo = () => {
    if (articulos.length === 0) return "PRO-0001";
    const lastCodigo = articulos[articulos.length - 1].codigo;
    const number = parseInt(lastCodigo.split("-")[1]) + 1;
    return `PRO-${number.toString().padStart(4, "0")}`;
  };

  const addOrEditArticulo = (articulo = null) => {
    const nextCodigo = articulo ? articulo.codigo : getNextCodigo();
    const isEdit = !!articulo;

    MySwal.fire({
      title: isEdit ? "Editar Articulo" : "Agregar Articulo",
      width: "800px",
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      focusConfirm: false,
      allowOutsideClick: false,
      html: `
        <form id="productForm" class="bg-white p-6 rounded shadow-md w-full" style="max-width: 800px;">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label for="codigo" class="block text-gray-700">Código</label>
              <input type="text" id="codigo" name="codigo" class="w-full px-3 py-2 border rounded" value="${nextCodigo}" readonly>
            </div>
            <div>
              <label for="nombre" class="block text-gray-700">Nombre</label>
              <input type="text" id="nombre" name="nombre" class="w-full px-3 py-2 border rounded" value="${
                articulo ? articulo.nombre : ""
              }">
            </div>
          </div>
          <div class="mb-4">
            <label for="imagen" class="block text-gray-700">Imagen</label>
            <input type="file" id="imagen" name="imagen" class="w-full px-3 py-2 border rounded">
          </div>
          <div class="mb-4">
            <label for="descripcion" class="block text-gray-700">Descripción</label>
            <textarea id="descripcion" name="descripcion" class="w-full px-3 py-2 border rounded">${
              articulo ? articulo.descripcion : ""
            }</textarea>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label for="tipo" class="block text-gray-700">Tipo</label>
              <select id="tipo" name="tipo" class="w-full px-3 py-2 border rounded" >
                <option value="Producto">Producto</option>
                <option value="Mano de obra">Mano de obra</option>
              </select>
            </div>
            <div>
              <label for="precio_compra" class="block text-gray-700">Precio de Compra</label>
              <input type="number" id="precio_compra" name="precio_compra" class="w-full px-3 py-2 border rounded" value="${
                articulo ? articulo.precio_compra : ""
              }">
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label for="precio_venta" class="block text-gray-700">Precio de Venta</label>
              <input type="number" id="precio_venta" name="precio_venta" class="w-full px-3 py-2 border rounded" value="${
                articulo ? articulo.precio_venta : ""
              }">
            </div>
          </div>
        </form>
      `,
      preConfirm: () => {
        const form = document.getElementById("productForm");
        const codigo = form.codigo.value;
        const nombre = form.nombre.value;
        const tipo = form.tipo.value;
        const precio_compra = form.precio_compra.value;
        const precio_venta = form.precio_venta.value;
        if (!codigo || !nombre || !tipo || !precio_compra || !precio_venta) {
          MySwal.showValidationMessage(
            "Por favor completa todos los campos, los unicos que no son obligatorios son imagen y descripcion"
          );
          return false;
        }
        const formData = new FormData();
        formData.append("codigo", codigo);
        formData.append("nombre", nombre);
        formData.append("imagen", form.imagen.files[0]);
        formData.append("descripcion", form.descripcion.value);
        formData.append("tipo", tipo);
        formData.append("precio_compra", precio_compra);
        formData.append("precio_venta", precio_venta);
        if (isEdit) {
          formData.append("id", articulo.id);
        }
        return formData;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const url = isEdit ? `/api/articulos/${articulo.id}` : "/api/articulos";
        const method = isEdit ? "PUT" : "POST";
        fetch(url, {
          method: method,
          body: result.value,
        })
          .then((response) => {
            if (!response.ok) {
              toast.error("Error en la solicitud de red.");
            }
            return response.json();
          })
          .then(async (data) => {
            const dataArticulos = await loadArticulos();
            setArticulos(dataArticulos);
            toast.success(
              `Articulo ${isEdit ? "editado" : "agregado"} exitosamente...`
            );
          });
      }
    });
  };

  async function loadArticulos() {
    const response = await fetch("/api/articulos");
    const articulos = await response.json();
    return articulos.filter(
      (articulo) =>
        articulo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        articulo.codigo.includes(searchTerm)
    );
  }

  useEffect(() => {
    const fetchData = async () => {
      const dataArticulos = await loadArticulos();
      setArticulos(dataArticulos);
    };
    fetchData();
  }, [searchTerm]);

  const handleClickPrev = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleClickNext = () => {
    if ((currentPage + 1) * articulosPerPage < articulos.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    console.log(searchTerm);
  };

  return (
    <>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <Toaster richColors />
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">Lista de productos</h1>
          </div>
          <div className="flex items-center">
            <input
              type="text"
              className="border text-black border-gray-300 px-3 py-2 mr-2"
              placeholder="Buscar Codigo o por nombre..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <button
              onClick={() => addOrEditArticulo()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Agregar
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {articulos
            .slice(
              currentPage * articulosPerPage,
              (currentPage + 1) * articulosPerPage
            )
            .map((articulo) => (
              <div
                key={articulo.id}
                className="p-4 border rounded-lg hover:bg-white hover:text-gray-600 cursor-pointer"
                onClick={() => addOrEditArticulo(articulo)}
              >
                <img
                  className="w-20 h-20 rounded-full mx-auto mb-4"
                  src={
                    articulo.imagen
                      ? articulo.imagen
                      : "/uploads/noproducto.jfif"
                  }
                />
                <div className="text-center">
                  <h2 className="text-lg font-semibold mb-2">
                    {articulo.nombre}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Codigo: {articulo.codigo}
                  </p>
                  <p className="text-sm text-gray-600">
                    Precio venta: ${articulo.precio_venta}
                  </p>
                  <p className="text-sm text-gray-600">
                    Precio Compra: ${articulo.precio_compra}
                  </p>
                  <p className="text-sm text-gray-600">Tipo: {articulo.tipo}</p>
                </div>
              </div>
            ))}
        </div>
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleClickPrev}
            className="mr-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Anterior
          </button>
          <button
            onClick={handleClickNext}
            className="ml-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Siguiente
          </button>
        </div>
      </div>
    </>
  );
};
export default Articulos;
