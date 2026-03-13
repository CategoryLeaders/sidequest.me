package me.sidequest.app.data.repository

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Columns
import io.github.jan.supabase.postgrest.query.Order
import me.sidequest.app.data.model.Photo
import javax.inject.Inject
import javax.inject.Singleton

// [SQ.M-A-2603-0027] [SQ.M-A-2603-0033]

@Singleton
class PhotoRepository @Inject constructor(
    private val supabase: SupabaseClient,
) {
    /**
     * Returns a page of photos for [userId], ordered newest-first.
     *
     * @param page       0-indexed page number.
     * @param pageSize   Number of photos per page.
     * @param filterTag  If non-null, only returns photos whose `tags` array contains this label.
     *                   Uses Supabase PostgREST `cs` (contains) operator on the JSON tags column.
     */
    suspend fun getPhotos(
        userId   : String,
        page     : Int,
        pageSize : Int     = PAGE_SIZE,
        filterTag: String? = null,
    ): List<Photo> = runCatching {
        supabase.postgrest["photos"]
            .select(Columns.ALL) {
                filter {
                    eq("user_id", userId)
                    if (filterTag != null) {
                        contains("tags", "[\"$filterTag\"]")
                    }
                }
                order("created_at", Order.DESCENDING)
                range(
                    from = (page * pageSize).toLong(),
                    to   = (page * pageSize + pageSize - 1).toLong(),
                )
            }
            .decodeList<Photo>()
    }.getOrDefault(emptyList())

    companion object {
        const val PAGE_SIZE = 30
    }
}
