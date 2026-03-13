package me.sidequest.app.data.model

// [SQ.M-A-2603-0033]

import androidx.compose.ui.graphics.Color
import kotlinx.serialization.Serializable

/**
 * Mirrors the SiteTag shape stored in the `site_tags` JSONB column on `profiles`.
 * Matches the web's SiteTag interface in web/src/lib/tags.ts.
 */
@Serializable
data class SiteTag(
    val label: String,
    val color: String,   // one of the StickerColor string keys
)

/**
 * Maps the web sticker colour keys to their exact Compose [Color] values
 * (sourced from CSS custom properties in web/src/app/globals.css).
 *
 * Also provides a convenience [textColor] that is readable on each background.
 */
object StickerPalette {

    data class StickerStyle(
        val background: Color,
        val textColor : Color,
    )

    private val orange  = StickerStyle(Color(0xFF_FF6B35), Color.White)
    private val green   = StickerStyle(Color(0xFF_00D4AA), Color(0xFF_111111))
    private val blue    = StickerStyle(Color(0xFF_4D9FFF), Color.White)
    private val yellow  = StickerStyle(Color(0xFF_FFD23F), Color(0xFF_111111))
    private val lilac   = StickerStyle(Color(0xFF_C4A8FF), Color(0xFF_111111))
    private val pink    = StickerStyle(Color(0xFF_FF69B4), Color.White)

    private val fallback = StickerStyle(Color(0xFF_888888), Color.White)

    fun styleFor(colorKey: String): StickerStyle = when (colorKey) {
        "sticker-orange" -> orange
        "sticker-green"  -> green
        "sticker-blue"   -> blue
        "sticker-yellow" -> yellow
        "sticker-lilac"  -> lilac
        "sticker-pink"   -> pink
        else             -> fallback
    }
}
