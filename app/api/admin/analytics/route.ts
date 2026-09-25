export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || !['ADMIN', 'OWNER', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '7d'

    let daysBack = 7
    if (range === '30d') daysBack = 30
    if (range === '90d') daysBack = 90
    if (range === '24h') daysBack = 1

    const since = new Date()
    since.setDate(since.getDate() - daysBack)

    // Parallel queries
    const [visits, events, totalVisitsCount, uniqueSessionsCount, leadCount] = await Promise.all([
      prisma.siteVisit.findMany({
        where: { visitedAt: { gte: since } },
        orderBy: { visitedAt: 'asc' },
        select: {
          id: true,
          sessionId: true,
          pageUrl: true,
          pageTitle: true,
          referrer: true,
          utmSource: true,
          utmMedium: true,
          utmCampaign: true,
          deviceType: true,
          browser: true,
          os: true,
          timeOnPage: true,
          scrollDepth: true,
          isEntryPage: true,
          isExitPage: true,
          visitedAt: true,
        },
      }),
      prisma.siteEvent.findMany({
        where: { createdAt: { gte: since } },
        select: {
          id: true,
          sessionId: true,
          eventType: true,
          eventTarget: true,
          pageUrl: true,
          createdAt: true,
        },
      }),
      prisma.siteVisit.count({ where: { visitedAt: { gte: since } } }),
      prisma.siteVisit.groupBy({
        by: ['sessionId'],
        where: { visitedAt: { gte: since } },
      }),
      prisma.leadCapture.count({ where: { createdAt: { gte: since } } }),
    ])

    // Compute aggregates
    type Visit = typeof visits[number]
    type Event = typeof events[number]
    const uniqueSessions = uniqueSessionsCount.length
    const visitsWithTime = visits.filter((v: Visit) => v.timeOnPage != null)
    const avgTimeOnPage = visitsWithTime.length > 0
      ? Math.round(visitsWithTime.reduce((a: number, v: Visit) => a + (v.timeOnPage || 0), 0) / visitsWithTime.length)
      : 0
    const visitsWithScroll = visits.filter((v: Visit) => v.scrollDepth != null)
    const avgScrollDepth = visitsWithScroll.length > 0
      ? Math.round(visitsWithScroll.reduce((a: number, v: Visit) => a + (v.scrollDepth || 0), 0) / visitsWithScroll.length)
      : 0

    // Page views by page
    const pageViewsByPage: Record<string, number> = {}
    visits.forEach((v: Visit) => {
      const page = v.pageUrl || 'unknown'
      pageViewsByPage[page] = (pageViewsByPage[page] || 0) + 1
    })
    const topPages = Object.entries(pageViewsByPage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([page, views]) => ({ page, views }))

    // Traffic sources
    const sourceMap: Record<string, number> = {}
    const sessionSources: Record<string, string> = {}
    visits.filter((v: Visit) => v.isEntryPage).forEach((v: Visit) => {
      let source = 'Direct'
      if (v.utmSource) source = v.utmSource
      else if (v.referrer) {
        try {
          const url = new URL(v.referrer)
          source = url.hostname
        } catch { source = v.referrer }
      }
      sessionSources[v.sessionId] = source
      sourceMap[source] = (sourceMap[source] || 0) + 1
    })
    const trafficSources = Object.entries(sourceMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([source, count]) => ({ source, count }))

    // Device breakdown
    const deviceMap: Record<string, number> = {}
    const sessionDevices = new Set<string>()
    visits.forEach((v: Visit) => {
      const key = `${v.sessionId}_${v.deviceType}`
      if (!sessionDevices.has(key)) {
        sessionDevices.add(key)
        const device = v.deviceType || 'unknown'
        deviceMap[device] = (deviceMap[device] || 0) + 1
      }
    })
    const deviceBreakdown = Object.entries(deviceMap).map(([device, count]) => ({ device, count }))

    // Browser breakdown
    const browserMap: Record<string, number> = {}
    visits.forEach((v: Visit) => {
      if (v.browser) browserMap[v.browser] = (browserMap[v.browser] || 0) + 1
    })
    const browserBreakdown = Object.entries(browserMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([browser, count]) => ({ browser, count }))

    // Page views over time (daily)
    const dailyMap: Record<string, { views: number; sessions: Set<string> }> = {}
    visits.forEach((v: Visit) => {
      const day = v.visitedAt.toISOString().slice(0, 10)
      if (!dailyMap[day]) dailyMap[day] = { views: 0, sessions: new Set() }
      dailyMap[day].views++
      dailyMap[day].sessions.add(v.sessionId)
    })
    const dailyStats = Object.entries(dailyMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({
        date,
        views: data.views,
        sessions: data.sessions.size,
      }))

    // Top events
    const eventTypeMap: Record<string, number> = {}
    events.forEach((e: Event) => {
      eventTypeMap[e.eventType] = (eventTypeMap[e.eventType] || 0) + 1
    })
    const topEvents = Object.entries(eventTypeMap)
      .sort((a, b) => b[1] - a[1])
      .map(([eventType, count]) => ({ eventType, count }))

    // Top CTAs clicked
    const ctaMap: Record<string, number> = {}
    events.filter((e: Event) => e.eventType === 'cta_click').forEach((e: Event) => {
      const target = e.eventTarget || 'unknown'
      ctaMap[target] = (ctaMap[target] || 0) + 1
    })
    const topCTAs = Object.entries(ctaMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([cta, count]) => ({ cta, count }))

    // Bounce rate (sessions with only 1 page view)
    const sessionPageCounts: Record<string, number> = {}
    visits.forEach((v: Visit) => {
      sessionPageCounts[v.sessionId] = (sessionPageCounts[v.sessionId] || 0) + 1
    })
    const singlePageSessions = Object.values(sessionPageCounts).filter(c => c === 1).length
    const bounceRate = uniqueSessions > 0 ? Math.round((singlePageSessions / uniqueSessions) * 100) : 0

    // Entry pages
    const entryPageMap: Record<string, number> = {}
    visits.filter((v: Visit) => v.isEntryPage).forEach((v: Visit) => {
      entryPageMap[v.pageUrl] = (entryPageMap[v.pageUrl] || 0) + 1
    })
    const topEntryPages = Object.entries(entryPageMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([page, count]) => ({ page, count }))

    // Exit pages
    const exitPageMap: Record<string, number> = {}
    visits.filter((v: Visit) => v.isExitPage).forEach((v: Visit) => {
      exitPageMap[v.pageUrl] = (exitPageMap[v.pageUrl] || 0) + 1
    })
    const topExitPages = Object.entries(exitPageMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([page, count]) => ({ page, count }))

    return NextResponse.json({
      success: true,
      summary: {
        totalPageViews: totalVisitsCount,
        uniqueSessions,
        avgTimeOnPage,
        avgScrollDepth,
        bounceRate,
        newLeads: leadCount,
        phoneClicks: events.filter((e: Event) => e.eventType === 'phone_click').length,
        ctaClicks: events.filter((e: Event) => e.eventType === 'cta_click').length,
      },
      dailyStats,
      topPages,
      trafficSources,
      deviceBreakdown,
      browserBreakdown,
      topEvents,
      topCTAs,
      topEntryPages,
      topExitPages,
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
