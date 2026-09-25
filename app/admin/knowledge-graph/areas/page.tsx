// ============================================================================
// Admin Service Areas Management
// CRUD interface for service areas
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ServiceArea {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  zipCodes: string[];
  priority: number;
  isActive: boolean;
  description?: string;
  _count: { technicians: number };
}

export default function AdminServiceAreasPage() {
  const [areas, setAreas] = useState<ServiceArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');

  useEffect(() => {
    fetchAreas();
  }, [filter]);

  async function fetchAreas() {
    try {
      const params = new URLSearchParams();
      if (filter === 'active') params.set('active', 'true');
      
      const res = await fetch(`/api/knowledge-graph/service-areas?${params}`);
      const data = await res.json();
      setAreas(data.data || []);
    } catch (error) {
      console.error('Error fetching areas:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(id: string, currentState: boolean) {
    try {
      await fetch(`/api/knowledge-graph/service-areas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentState }),
      });
      fetchAreas();
    } catch (error) {
      console.error('Error toggling area:', error);
    }
  }

  const filteredAreas = filter === 'all' 
    ? areas 
    : areas.filter(a => filter === 'active' ? a.isActive : !a.isActive);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Link href="/admin/knowledge-graph" className="hover:text-gray-700">Knowledge Graph</Link>
                <span>/</span>
                <span>Service Areas</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Service Areas</h1>
            </div>
            <Link
              href="/admin/knowledge-graph/areas/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Area
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex bg-white rounded-lg border p-1">
            {(['all', 'active', 'inactive'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <span className="text-sm text-gray-500">
            {filteredAreas.length} areas
          </span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Area
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zip Codes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Technicians
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredAreas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No service areas found
                  </td>
                </tr>
              ) : (
                filteredAreas.map((area) => (
                  <tr key={area.id} className={!area.isActive ? 'opacity-50' : ''}>
                    <td className="px-6 py-4">
                      <div>
                        <Link
                          href={`/admin/knowledge-graph/areas/${area.id}`}
                          className="font-medium text-gray-900 hover:text-primary-600"
                        >
                          {area.name}
                        </Link>
                        <p className="text-sm text-gray-500">
                          {area.city}, {area.state}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {area.zipCodes.slice(0, 3).map((zip) => (
                          <span key={zip} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {zip}
                          </span>
                        ))}
                        {area.zipCodes.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{area.zipCodes.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm ${
                        area.priority >= 8 ? 'text-primary-600 font-medium' : 'text-gray-600'
                      }`}>
                        {area.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {area._count.technicians}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActive(area.id, area.isActive)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          area.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          area.isActive ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                        {area.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/knowledge-graph/areas/${area.id}`}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </Link>
                        <Link
                          href={`/sewer-inspection-${area.slug}`}
                          target="_blank"
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
