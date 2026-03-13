package me.sidequest.app.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

// [SQ.M-A-2603-0024] [SQ.M-A-2603-0031]

/**
 * Subset of profile fields sent to Supabase on save.
 * Mirrors columns in the `profiles` table.
 * Also used as the JSON payload in the offline sync queue.
 */
@Serializable
data class ProfileUpdate(
    @SerialName("display_name")   val displayName  : String?       = null,
    val bio                                         : String?       = null,
    @SerialName("avatar_url")     val avatarUrl     : String?       = null,
    @SerialName("ticker_items")   val tickerItems   : List<String>? = null,
    @SerialName("ticker_enabled") val tickerEnabled : Boolean?      = null,
    val likes                                       : List<String>? = null,
    val dislikes                                    : List<String>? = null,
)
