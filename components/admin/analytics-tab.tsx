'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  BarChart3, TrendingUp, TrendingDown, Users, Clock, MousePointer, Phone, Eye,
  ArrowUp, ArrowDown, Monitor, Smartphone, Tablet, Globe, Loader2, RefreshCw,
  Target, LogIn, LogOut as LogOutIcon, Activity, Zap, Filter, ChevronDown, ChevronUp
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, ComposedChart, RadialBarChart, RadialBar,
  Treemap
} from 'recharts'

interface AnalyticsData {
  summary: {
    totalPageViews: number
    uniqueSessions: number
    avgTimeOnPage: number
    avgScrollDepth: number
    bounceRate: number
    newLeads: number
    phoneClicks: number
    ctaClicks: number
  }
  dailyStats: { date: string; views: number; sessions: number }[]
  topPages: { page: string; views: number }[]
  trafficSources: { source: string; count: number }[]
  deviceBreakdown: { device: string; count: number }[]
  browserBreakdown: { browser: string; count: number }[]
  topEvents: { eventType: string; count: number }[]
  topCTAs: { cta: string; count: number }[]
  topEntryPages: { page: string; count: number }[]
  topExitPages: { page: string; count: number }[]
}

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']
const GRADIENT_COLORS = [
  { start: '#3b82f6', end: '#1d4ed8' },
  { start: '#10b981', end: '#059669' },
  { start: '#8b5cf6', end: '#6d28d9' },
  { start: '#f59e0b', end: '#d97706' },
  { start: '#ef4444', end: '#dc2626' },
  { start: '#ec4899', end: '#db2777' },
  { start: '#06b6d4', end: '#0891b2' },
  { start: '#f97316', end: '#ea580c' },
]

const DEVICE_ICONS: Record<string, typeof Monitor> = {
  desktop: Monitor,
  tablet: Tablet,
  mobile: Smartphone,
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

function formatPageName(url: string): string {
  if (url === '/') return 'Home'
  return url.replace(/^\//, '').replace(/\//g, ' › ').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

const CustomTooltipStyle = {
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
  padding: '12px 16px',
  fontSize: '13px',
}

export function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('7d')
  const [refreshing, setRefreshing] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/analytics?range=${range}`)
      const json = await res.json()
      if (json.success) setData(json)
    } catch (e) {
      console.error('Failed to load analytics:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [range])

  useEffect(() => {
    setLoading(true)
    fetchData()
  }, [fetchData])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  // Compute engagement funnel data
  const funnelData = useMemo(() => {
    if (!data) return []
    const s = data.summary
    return [
      { name: 'Page Views', value: s.totalPageViews, fill: '#3b82f6' },
      { name: 'Unique Visitors', value: s.uniqueSessions, fill: '#8b5cf6' },
      { name: 'CTA Clicks', value: s.ctaClicks, fill: '#f59e0b' },
      { name: 'Phone Clicks', value: s.phoneClicks, fill: '#10b981' },
      { name: 'New Leads', value: s.newLeads, fill: '#ef4444' },
    ]
  }, [data])

  // Compute conversion rates
  const conversionRates = useMemo(() => {
    if (!data) return { visitorToLead: 0, visitorToCTA: 0, visitorToPhone: 0 }
    const s = data.summary
    const visitors = s.uniqueSessions || 1
    return {
      visitorToLead: Math.round((s.newLeads / visitors) * 100 * 10) / 10,
      visitorToCTA: Math.round((s.ctaClicks / visitors) * 100 * 10) / 10,
      visitorToPhone: Math.round((s.phoneClicks / visitors) * 100 * 10) / 10,
    }
  }, [data])

  // Compute daily average metrics
  const dailyAvg = useMemo(() => {
    if (!data || data.dailyStats.length === 0) return { views: 0, sessions: 0 }
    const days = data.dailyStats.length
    const totalViews = data.dailyStats.reduce((a, b) => a + b.views, 0)
    const totalSessions = data.dailyStats.reduce((a, b) => a + b.sessions, 0)
    return { views: Math.round(totalViews / days), sessions: Math.round(totalSessions / days) }
  }, [data])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-sm text-gray-500">Loading analytics data...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-lg">No analytics data available yet</p>
        <p className="text-gray-400 text-sm mt-1">Data will appear once visitors start interacting with your site</p>
      </div>
    )
  }

  const { summary, dailyStats, topPages, trafficSources, deviceBreakdown, browserBreakdown, topCTAs, topEntryPages, topExitPages } = data

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-blue-600 hidden sm:block" />
          <h3 className="text-base font-semibold text-gray-800 hidden sm:block">Site Analytics</h3>
          <div className="flex gap-1.5 bg-gray-100 p-1 rounded-lg">
            {['24h', '7d', '30d', '90d'].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-sm rounded-md font-medium transition-all duration-200 ${
                  range === r
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                }`}
              >
                {r === '24h' ? '24h' : r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-400 hidden lg:block">
            Avg. {dailyAvg.views} views / {dailyAvg.sessions} visitors per day
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards - Enhanced for Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KPICard icon={Eye} label="Page Views" value={summary.totalPageViews} color="blue" sparkData={dailyStats.map(d => d.views)} />
        <KPICard icon={Users} label="Unique Visitors" value={summary.uniqueSessions} color="green" sparkData={dailyStats.map(d => d.sessions)} />
        <KPICard icon={Clock} label="Avg. Time" value={formatTime(summary.avgTimeOnPage)} color="purple" />
        <KPICard icon={TrendingUp} label="Scroll Depth" value={`${summary.avgScrollDepth}%`} color="amber" percentage={summary.avgScrollDepth} />
        <KPICard icon={ArrowDown} label="Bounce Rate" value={`${summary.bounceRate}%`} color="red" percentage={summary.bounceRate} negative />
        <KPICard icon={Target} label="New Leads" value={summary.newLeads} color="emerald" highlight />
        <KPICard icon={Phone} label="Phone Clicks" value={summary.phoneClicks} color="indigo" />
        <KPICard icon={MousePointer} label="CTA Clicks" value={summary.ctaClicks} color="orange" />
      </div>

      {/* Conversion Rates Strip - Desktop only */}
      <div className="hidden lg:grid grid-cols-3 gap-4">
        <ConversionCard label="Visitor → Lead" rate={conversionRates.visitorToLead} color="emerald" />
        <ConversionCard label="Visitor → CTA" rate={conversionRates.visitorToCTA} color="amber" />
        <ConversionCard label="Visitor → Phone" rate={conversionRates.visitorToPhone} color="indigo" />
      </div>

      {/* Traffic Over Time - Enhanced */}
      {dailyStats.length > 0 && (
        <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Traffic Over Time</h3>
            <div className="hidden lg:flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded-full bg-blue-500"></span>Page Views</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded-full bg-emerald-500"></span>Sessions</span>
            </div>
          </div>
          <div className="h-64 lg:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyStats}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  fontSize={12}
                  tick={{ fill: '#9ca3af' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis fontSize={12} tick={{ fill: '#9ca3af' }} axisLine={{ stroke: '#e5e7eb' }} />
                <Tooltip
                  labelFormatter={(d) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  contentStyle={CustomTooltipStyle}
                />
                <Area type="monotone" dataKey="views" stroke="#3b82f6" fill="url(#colorViews)" name="Page Views" strokeWidth={2.5} dot={false} activeDot={{ r: 6, strokeWidth: 2 }} />
                <Area type="monotone" dataKey="sessions" stroke="#10b981" fill="url(#colorSessions)" name="Sessions" strokeWidth={2.5} dot={false} activeDot={{ r: 6, strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Engagement Funnel - Desktop enhanced */}
      {funnelData.length > 0 && funnelData[0].value > 0 && (
        <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Engagement Funnel
          </h3>
          <div className="flex flex-col lg:flex-row items-center gap-3 lg:gap-0">
            {funnelData.map((step, i) => {
              const maxVal = funnelData[0].value || 1
              const widthPct = Math.max(20, (step.value / maxVal) * 100)
              const dropOff = i > 0 && funnelData[i - 1].value > 0
                ? Math.round((1 - step.value / funnelData[i - 1].value) * 100)
                : 0
              return (
                <div key={step.name} className="flex-1 w-full lg:w-auto">
                  <div className="flex flex-col items-center">
                    <div
                      className="rounded-xl py-3 lg:py-4 px-4 text-center transition-all duration-300 hover:scale-105 w-full"
                      style={{
                        backgroundColor: step.fill + '15',
                        borderLeft: `4px solid ${step.fill}`,
                        maxWidth: `${widthPct}%`,
                        minWidth: '120px',
                      }}
                    >
                      <p className="text-2xl lg:text-3xl font-bold" style={{ color: step.fill }}>{formatNumber(step.value)}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{step.name}</p>
                    </div>
                    {i < funnelData.length - 1 && dropOff > 0 && (
                      <div className="text-[10px] text-gray-400 mt-1 hidden lg:block">↓ {dropOff}% drop</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Two/Three Column Layout for Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {/* Top Pages */}
        <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm xl:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Top Pages
          </h3>
          <div className="space-y-2.5">
            {topPages.map((p, i) => (
              <div key={i} className="group flex items-center justify-between hover:bg-gray-50 rounded-lg px-2 py-1.5 -mx-2 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-xs font-bold text-gray-300 w-6 text-center">{i + 1}</span>
                  <span className="text-sm text-gray-700 truncate group-hover:text-blue-600 transition-colors">{formatPageName(p.page)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-28 lg:w-40 bg-gray-100 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-full h-2.5 transition-all duration-500"
                      style={{ width: `${topPages[0] ? (p.views / topPages[0].views) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-14 text-right">{formatNumber(p.views)}</span>
                </div>
              </div>
            ))}
            {topPages.length === 0 && <p className="text-sm text-gray-400">No data yet</p>}
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-green-500" />
            Traffic Sources
          </h3>
          {trafficSources.length > 0 ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-44 h-44 lg:w-52 lg:h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={trafficSources}
                      dataKey="count"
                      nameKey="source"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                      paddingAngle={2}
                    >
                      {trafficSources.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={CustomTooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full space-y-2">
                {trafficSources.map((s, i) => {
                  const total = trafficSources.reduce((a, b) => a + b.count, 0)
                  const pct = total > 0 ? Math.round((s.count / total) * 100) : 0
                  return (
                    <div key={i} className="flex items-center gap-2 group">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm text-gray-600 flex-1 truncate">{s.source}</span>
                      <span className="text-xs text-gray-400">{pct}%</span>
                      <span className="text-sm font-semibold text-gray-900">{s.count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No data yet</p>
          )}
        </div>

        {/* Device Breakdown - Enhanced */}
        <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Devices</h3>
          <div className="grid grid-cols-3 gap-3">
            {deviceBreakdown.map((d, i) => {
              const Icon = DEVICE_ICONS[d.device] || Monitor
              const total = deviceBreakdown.reduce((a, b) => a + b.count, 0)
              const pct = total > 0 ? Math.round((d.count / total) * 100) : 0
              return (
                <div key={i} className="text-center p-3 lg:p-4 bg-gradient-to-b from-gray-50 to-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-200 group cursor-default">
                  <Icon className="w-7 h-7 lg:w-9 lg:h-9 mx-auto mb-2 text-blue-500 group-hover:text-blue-600 transition-colors" />
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900">{pct}%</p>
                  <p className="text-xs text-gray-500 capitalize mt-0.5">{d.device}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{d.count} visits</p>
                </div>
              )
            })}
            {deviceBreakdown.length === 0 && <p className="text-sm text-gray-400 col-span-3">No data yet</p>}
          </div>
        </div>

        {/* Browser Breakdown - Enhanced */}
        <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Browsers</h3>
          {browserBreakdown.length > 0 ? (
            <div className="h-48 lg:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={browserBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis type="number" fontSize={12} tick={{ fill: '#9ca3af' }} axisLine={{ stroke: '#e5e7eb' }} />
                  <YAxis dataKey="browser" type="category" width={70} fontSize={12} tick={{ fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={CustomTooltipStyle} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Views">
                    {browserBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No data yet</p>
          )}
        </div>

        {/* Top CTAs - Enhanced */}
        <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MousePointer className="w-5 h-5 text-orange-500" />
            Top CTA Clicks
          </h3>
          <div className="space-y-3">
            {topCTAs.map((c, i) => {
              const maxCount = topCTAs[0]?.count || 1
              return (
                <div key={i} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 truncate flex-1 group-hover:text-orange-600 transition-colors">{c.cta}</span>
                    <span className="text-sm font-semibold text-orange-600 ml-2">{c.count}</span>
                  </div>
                  <div className="w-full bg-orange-50 rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-orange-400 to-orange-600 rounded-full h-1.5 transition-all duration-500"
                      style={{ width: `${(c.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {topCTAs.length === 0 && <p className="text-sm text-gray-400">No CTA clicks recorded yet</p>}
          </div>
        </div>
      </div>

      {/* Entry & Exit Pages - Full Width Enhanced */}
      <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <LogIn className="w-5 h-5 text-green-500" />
              Top Entry Pages
            </h4>
            <div className="space-y-2">
              {topEntryPages.map((p, i) => (
                <div key={i} className="flex items-center justify-between group hover:bg-green-50 rounded-lg px-2 py-1.5 -mx-2 transition-colors">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-xs font-bold text-gray-300 w-5">{i + 1}</span>
                    <span className="text-sm text-gray-600 truncate group-hover:text-green-700">{formatPageName(p.page)}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 ml-2">{p.count}</span>
                </div>
              ))}
              {topEntryPages.length === 0 && <p className="text-sm text-gray-400">No data yet</p>}
            </div>
          </div>
          <div className="border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-8">
            <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <LogOutIcon className="w-5 h-5 text-red-500" />
              Top Exit Pages
            </h4>
            <div className="space-y-2">
              {topExitPages.map((p, i) => (
                <div key={i} className="flex items-center justify-between group hover:bg-red-50 rounded-lg px-2 py-1.5 -mx-2 transition-colors">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-xs font-bold text-gray-300 w-5">{i + 1}</span>
                    <span className="text-sm text-gray-600 truncate group-hover:text-red-700">{formatPageName(p.page)}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 ml-2">{p.count}</span>
                </div>
              ))}
              {topExitPages.length === 0 && <p className="text-sm text-gray-400">No data yet</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* Enhanced KPI Card with optional sparkline */
function KPICard({
  icon: Icon,
  label,
  value,
  color,
  sparkData,
  percentage,
  negative,
  highlight,
}: {
  icon: typeof Eye
  label: string
  value: string | number
  color: string
  sparkData?: number[]
  percentage?: number
  negative?: boolean
  highlight?: boolean
}) {
  const colorMap: Record<string, { bg: string; text: string; accent: string; ring: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', accent: '#3b82f6', ring: 'ring-blue-200' },
    green: { bg: 'bg-green-50', text: 'text-green-600', accent: '#10b981', ring: 'ring-green-200' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', accent: '#8b5cf6', ring: 'ring-purple-200' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', accent: '#f59e0b', ring: 'ring-amber-200' },
    red: { bg: 'bg-red-50', text: 'text-red-600', accent: '#ef4444', ring: 'ring-red-200' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', accent: '#10b981', ring: 'ring-emerald-200' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', accent: '#6366f1', ring: 'ring-indigo-200' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', accent: '#f97316', ring: 'ring-orange-200' },
  }
  const c = colorMap[color] || colorMap.blue

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 ${highlight ? `ring-2 ${c.ring}` : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${c.bg} ${c.text}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xl lg:text-2xl font-bold text-gray-900 truncate">{typeof value === 'number' ? formatNumber(value) : value}</p>
            <p className="text-xs lg:text-sm text-gray-500">{label}</p>
          </div>
        </div>
      </div>
      {/* Mini sparkline for desktop */}
      {sparkData && sparkData.length > 1 && (
        <div className="mt-2 h-8 hidden lg:block">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData.map((v, i) => ({ v, i }))}>
              <defs>
                <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={c.accent} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={c.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={c.accent} fill={`url(#spark-${color})`} strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      {/* Percentage bar for metrics like scroll depth, bounce rate */}
      {percentage !== undefined && (
        <div className="mt-2 hidden lg:block">
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className={`rounded-full h-1.5 transition-all duration-700 ${negative ? 'bg-red-400' : 'bg-emerald-400'}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

/* Conversion Rate Card */
function ConversionCard({ label, rate, color }: { label: string; rate: number; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-500 to-amber-600',
    indigo: 'from-indigo-500 to-indigo-600',
  }
  const bgMap: Record<string, string> = {
    emerald: 'bg-emerald-50 border-emerald-100',
    amber: 'bg-amber-50 border-amber-100',
    indigo: 'bg-indigo-50 border-indigo-100',
  }
  const textMap: Record<string, string> = {
    emerald: 'text-emerald-700',
    amber: 'text-amber-700',
    indigo: 'text-indigo-700',
  }
  return (
    <div className={`rounded-xl p-4 border ${bgMap[color] || 'bg-gray-50 border-gray-100'}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${textMap[color] || 'text-gray-700'}`}>{rate}%</p>
        </div>
        <div className="w-16 h-16">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" data={[{ value: rate }]} startAngle={90} endAngle={90 - (rate / 100) * 360}>
              <RadialBar dataKey="value" cornerRadius={10} fill={`${color === 'emerald' ? '#10b981' : color === 'amber' ? '#f59e0b' : '#6366f1'}`} background={{ fill: '#f3f4f6' }} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
