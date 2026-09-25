// ============================================================================
// Admin Knowledge Graph Dashboard
// Central management for all brand visibility data
// ============================================================================

'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AdminKnowledgeGraphPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'areas' | 'services' | 'faqs'>('overview');

  const menuItems = [
    { id: 'overview', label: 'Overview', href: '/admin/knowledge-graph', icon: 'M3 12l2-2m0 0l7-7 7 7-7M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10' },
    { id: 'areas', label: 'Service Areas', href: '/admin/knowledge-graph/areas', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'services', label: 'Services', href: '/admin/knowledge-graph/services', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'faqs', label: 'FAQs', href: '/admin/knowledge-graph/faqs', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.007 2.007-1.504-1.007-2.753-2.007-3.753-2.007a2 2 0 00-2 1.5c0 .885.956 1.6 2.25 1.6z M12 15v5m-3-3h6' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Knowledge Graph</h1>
              <p className="text-sm text-gray-500">Manage your brand visibility data</p>
            </div>
            <Link
              href="/admin"
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Admin
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Service Areas"
            value="10"
            icon="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            href="/admin/knowledge-graph/areas"
          />
          <StatCard
            title="Services"
            value="7"
            icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37"
            href="/admin/knowledge-graph/services"
          />
          <StatCard
            title="Published FAQs"
            value="24"
            icon="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.007 2.007"
            href="/admin/knowledge-graph/faqs"
          />
          <StatCard
            title="Schema Status"
            value="Active"
            icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            href="#"
            status="success"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <QuickAction
              title="Add Service Area"
              description="Add a new city or region you serve"
              href="/admin/knowledge-graph/areas/new"
              icon="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
            <QuickAction
              title="Add Service"
              description="Create a new inspection service offering"
              href="/admin/knowledge-graph/services/new"
              icon="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
            <QuickAction
              title="Add FAQ"
              description="Add a new question and answer"
              href="/admin/knowledge-graph/faqs/new"
              icon="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </div>
        </div>

        {/* SEO Preview */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Local SEO Status</h2>
          <div className="space-y-4">
            <SEOCheck
              label="Schema.org Markup"
              description="Structured data ready for search engines"
              status="success"
            />
            <SEOCheck
              label="Service Area Pages"
              description="10 optimized landing pages generated"
              status="success"
            />
            <SEOCheck
              label="FAQ Schema"
              description="24 FAQs with structured markup"
              status="success"
            />
            <SEOCheck
              label="Google Business Profile"
              description="Sync your listing with your knowledge graph"
              status="pending"
              action="Connect Google"
            />
            <SEOCheck
              label="Yelp Integration"
              description="Keep your Yelp listing in sync"
              status="pending"
              action="Connect Yelp"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Sub-Components
// ============================================================================

function StatCard({ title, value, icon, href, status }: {
  title: string;
  value: string | number;
  icon: string;
  href: string;
  status?: 'success' | 'warning' | 'error';
}) {
  const statusColors = {
    success: 'bg-green-100 text-green-600',
    warning: 'bg-yellow-100 text-yellow-600',
    error: 'bg-red-100 text-red-600',
  };

  return (
    <Link href={href} className="block bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${status ? statusColors[status] : 'bg-primary-100 text-primary-600'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{title}</p>
        </div>
      </div>
    </Link>
  );
}

function QuickAction({ title, description, href, icon }: {
  title: string;
  description: string;
  href: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
    >
      <div className="p-2 bg-primary-100 rounded-lg">
        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
      </div>
      <div>
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </Link>
  );
}

function SEOCheck({ label, description, status, action }: {
  label: string;
  description: string;
  status: 'success' | 'pending' | 'warning';
  action?: string;
}) {
  const statusConfig = {
    success: { bg: 'bg-green-100', icon: '✓', text: 'text-green-600' },
    pending: { bg: 'bg-yellow-100', icon: '!', text: 'text-yellow-600' },
    warning: { bg: 'bg-red-100', icon: '×', text: 'text-red-600' },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-6 h-6 rounded-full ${config.bg} flex items-center justify-center text-xs font-bold ${config.text}`}>
          {config.icon}
        </div>
        <div>
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      {action && (
        <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          {action}
        </button>
      )}
    </div>
  );
}
