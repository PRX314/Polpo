import { useEffect } from 'react';

function ToolsLabXPage() {
  useEffect(() => {
    document.title = 'Laboratorio X - Paolino Tools';
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con link back */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/admin/dashboard"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Torna all'Admin
            </a>
            <span className="text-gray-300">|</span>
            <h1 className="text-lg font-semibold text-gray-800">
              🎨 Laboratorio X - Micro-Lab Creativo
            </h1>
          </div>
          <div className="text-sm text-gray-500">
            Paolino Tools
          </div>
        </div>
      </div>

      {/* Iframe container */}
      <div className="w-full" style={{ height: 'calc(100vh - 61px)' }}>
        <iframe
          src={`${import.meta.env.VITE_SERVER_URL}/tools/ultra-minimal-v2.html`}
          title="Laboratorio X"
          className="w-full h-full border-0"
          style={{ display: 'block' }}
        />
      </div>
    </div>
  );
}

export default ToolsLabXPage;
