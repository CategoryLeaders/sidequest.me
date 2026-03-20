// /[username]/thoughts/tags/[tag] — delegates to the thoughts index with ?tag= param
// Clean URL: /sophie/thoughts/tags/product → renders filtered thoughts page
import ThoughtsPage from '../../page'

export default async function ThoughtsTagPage({
  params,
}: {
  params: Promise<{ username: string; tag: string }>
}) {
  const { username, tag } = await params
  return ThoughtsPage({
    params: Promise.resolve({ username }),
    searchParams: Promise.resolve({ tag }),
  })
}
