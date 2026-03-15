// /[username]/ideas/tags/[tag] — delegates to the ideas index with ?tag= param
// Clean URL: /sophie/ideas/tags/product → renders filtered ideas page
import IdeasPage from '../../page'

export default async function IdeasTagPage({
  params,
}: {
  params: Promise<{ username: string; tag: string }>
}) {
  const { username, tag } = await params
  return IdeasPage({
    params: Promise.resolve({ username }),
    searchParams: Promise.resolve({ tag }),
  })
}
