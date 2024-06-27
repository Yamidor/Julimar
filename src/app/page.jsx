import Logo from "../../public/uploads/logo.jpeg";
function HomePage() {
  return (
    <>
      <div className="flex items-center justify-center mt-4">
        <div class="bg-gray-400 p-8 rounded-lg shadow-lg text-center max-w-sm">
          <img
            class="w-32 h-32 mx-auto rounded-full mb-4"
            src="/uploads/logo.jpeg"
            alt="Business Image"
          />
          <h2 class="text-2xl font-bold mb-2">Julimar P&G</h2>
          <p class="text-gray-700">
            Julimar P&G es una papelería dedicada a proporcionar una amplia gama
            de productos y servicios esenciales para estudiantes, profesionales
            y empresas. Esta papelería se especializa en ofrecer artículos de
            alta calidad, desde materiales escolares y de oficina hasta
            productos de arte y manualidades.
          </p>
        </div>
      </div>
    </>
  );
}

export default HomePage;
