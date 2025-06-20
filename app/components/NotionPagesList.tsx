import { useState } from "react";

export interface NotionPage {
  id: string;
  title: string;
  url?: string;
}

interface NotionPagesListProps {
  pages: NotionPage[];
  onSelectionChange: (selectedIds: string[]) => void;
}

export default function NotionPagesList({ pages, onSelectionChange }: NotionPagesListProps) {
  const [selectedPages, setSelectedPages] = useState<string[]>([]);

  const handleCheckboxChange = (pageId: string) => {
    const newSelection = selectedPages.includes(pageId)
      ? selectedPages.filter(id => id !== pageId)
      : [...selectedPages, pageId];
    
    setSelectedPages(newSelection);
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedPages.length === pages.length) {
      // Tout désélectionner
      setSelectedPages([]);
      onSelectionChange([]);
    } else {
      // Tout sélectionner
      const allIds = pages.map(page => page.id);
      setSelectedPages(allIds);
      onSelectionChange(allIds);
    }
  };

  return (
    <div className="notion-pages-list">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-700">Pages disponibles</h3>
        <button
          type="button"
          onClick={handleSelectAll}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          {selectedPages.length === pages.length ? "Tout désélectionner" : "Tout sélectionner"}
        </button>
      </div>

      {pages.length === 0 ? (
        <p className="text-gray-500 italic">Aucune page trouvée...</p>
      ) : (
        <div className="max-h-96 overflow-y-auto border rounded-md">
          <ul className="divide-y divide-gray-200">
            {pages.map(page => (
              <li key={page.id} className="p-3 hover:bg-gray-50">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPages.includes(page.id)}
                    onChange={() => handleCheckboxChange(page.id)}
                    className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="text-gray-800">{page.title}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-2 text-sm text-gray-500">
        {selectedPages.length} page(s) sélectionnée(s)
      </div>
    </div>
  );
} 