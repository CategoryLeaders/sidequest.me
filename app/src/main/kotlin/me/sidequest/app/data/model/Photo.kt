package me.sidequest.app.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

// [SQ.M-A-2603-0027] [SQ.M-A-2603-0033]

/**
 * Mirrors the `photos` Supabase table.
 * Images are served from the Bunny.net CDN at images.sidequest.me.
 */
@Serializable
data class Photo(
    val id         : String,
    @SerialName("user_id")     val userId     : String,
    @SerialName("image_url")   val imageUrl   : String,
    val caption    : String?  = null,
    @SerialName("taken_at")    val takenAt    : String?       = null,
    @SerialName("created_at")  val createdAt  : String,
    val tags                                   : List<String>? = null,   // [SQ.M-A-2603-0033]
)
