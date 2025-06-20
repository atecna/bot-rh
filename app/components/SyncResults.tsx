export interface SyncResult {
  id: string;
  name: string;
  success: boolean;
  error?: string;
  filePath?: string;
}

interface SyncResultsProps {
  results: SyncResult[];
  message?: string;
}

export default function SyncResults({ results, message }: SyncResultsProps) {
  if (!results || results.length === 0) {
    return null;
  }

  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Résultats de la synchronisation</h3>
      
      {message && (
        <p className="mb-2 text-sm font-medium">
          {message}
        </p>
      )}
      
      <p className="mb-2 text-sm">
        {successCount} sur {totalCount} pages synchronisées avec succès
      </p>
      
      <div className="border rounded-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Page
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {results.map((result) => (
              <tr key={result.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {result.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {result.success ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Succès
                    </span>
                  ) : (
                    <div>
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Échec
                      </span>
                      {result.error && (
                        <p className="text-xs text-red-500 mt-1">{result.error}</p>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 