import Link from "next/link";

const Navbar = ({ children }) => {
  return (
    <nav className="bg-gray-800 p-4">
      <ul className="flex justify-between">
        <li className="mr-6">
          <Link
            className="text-white hover:text-black hover:bg-white p-3 rounded-lg"
            href="/"
          >
            Inicio
          </Link>
        </li>
        <li className="mr-6">
          <Link
            className="text-white hover:text-black hover:bg-white p-3 rounded-lg"
            href="/articulos"
          >
            Productos
          </Link>
        </li>
        <li className="mr-6">
          <Link
            className="text-white hover:text-black hover:bg-white p-3 rounded-lg"
            href="/facturas"
          >
            Facturas
          </Link>
        </li>
        <li>
          <Link
            className="text-white hover:text-black hover:bg-white p-3 rounded-lg"
            href="/stock"
          >
            Stock
          </Link>
        </li>
        <li>
          <Link
            className="text-white hover:text-black hover:bg-white p-3 rounded-lg"
            href="/balance"
          >
            Balance
          </Link>
        </li>
        <li>
          <Link
            className="text-white hover:text-black hover:bg-white p-3 rounded-lg"
            href="/historiales"
          >
            Imprimir Facturas
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
