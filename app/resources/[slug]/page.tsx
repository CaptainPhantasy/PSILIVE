import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Header from '@/components/header'
import Footer from '@/components/footer'
import AIChat from '@/components/ai-chat'
import Link from 'next/link'
import { getAllPosts, getPostBySlug, markdownToHtml } from '@/lib/blog'
import { ArrowLeft, Calendar, Clock, User, ArrowRight } from 'lucide-react'
import { COMPANY_INFO } from '@/lib/constants'

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPostBySlug(params.slug)
  if (!post) return { title: 'Post Not Found' }

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
    },
    alternates: {
      canonical: `/resources/${params.slug}`,
    },
  }
}

export default function BlogPostPage({ params }: Props) {
  const post = getPostBySlug(params.slug)
  if (!post) notFound()

  const allPosts = getAllPosts()
  const relatedPosts = allPosts
    .filter(p => p.slug !== post.slug)
    .slice(0, 3)

  const htmlContent = markdownToHtml(post.content)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
            <nav className="flex items-center gap-2 text-sm text-gray-500">
              <Link href="/resources" className="hover:text-primary-600 transition-colors flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" />
                Resources
              </Link>
              <span>/</span>
              <span className="text-gray-900 truncate">{post?.title ?? ''}</span>
            </nav>
          </div>
        </div>

        {/* Article */}
        <article className="section-padding bg-white">
          <div className="max-w-4xl mx-auto">
            {/* Meta */}
            <div className="mb-8">
              <span className="inline-block px-3 py-1 bg-primary-50 text-primary-700 text-xs font-semibold rounded-full mb-4">
                {post?.category ?? 'General'}
              </span>
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">
                {post?.title ?? ''}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {post?.author ?? 'Precision Sewer Inspections'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {post?.date ? new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {post?.readTime ?? '5 min read'}
                </span>
              </div>
            </div>

            {/* Content */}
            <div
              className="prose prose-gray max-w-none"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts?.length > 0 && (
          <section className="section-padding bg-gray-50">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-8 text-center">
                More Resources
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedPosts?.map((related) => (
                  <Link
                    key={related?.slug}
                    href={`/resources/${related?.slug}`}
                    className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <span className="inline-block px-3 py-1 bg-primary-50 text-primary-700 text-xs font-semibold rounded-full mb-3">
                      {related?.category ?? 'General'}
                    </span>
                    <h3 className="font-heading font-bold text-gray-900 mb-2 group-hover:text-primary-700 transition-colors">
                      {related?.title ?? ''}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{related?.description ?? ''}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="section-padding bg-primary-900 text-white">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-heading font-bold mb-4">Ready to Inspect Your Sewer Line?</h2>
            <p className="text-primary-200 mb-8">
              Book your professional sewer inspection today. HD video, one-business-day reports, no upselling.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="btn-cta">
                Book Inspection
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href={`tel:${COMPANY_INFO?.phoneRaw ?? ''}`}
                className="btn-secondary bg-transparent border-primary-300 text-white hover:bg-primary-800"
              >
                Call {COMPANY_INFO?.phone ?? ''}
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <AIChat />
    </div>
  )
}
