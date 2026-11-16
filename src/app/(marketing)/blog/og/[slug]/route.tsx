import { ogImage } from '@/lib/seo/og'
import { postBySlug } from '@/lib/blog/posts'

/** The share image for posts without a hand-made one: category, title, brand. */
export const runtime = 'edge'

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const post = postBySlug(params.slug)
  if (!post) return new Response('Not found', { status: 404 })
  const res = ogImage(post.category, post.title, 'www.applymaster.ai/blog')
  res.headers.set('Cache-Control', 'public, max-age=86400, s-maxage=604800, immutable')
  return res
}
