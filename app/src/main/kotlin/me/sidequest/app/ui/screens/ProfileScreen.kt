package me.sidequest.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.ThumbDown
import androidx.compose.material.icons.filled.ThumbUp
import androidx.compose.material3.AssistChip
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SmallFloatingActionButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import me.sidequest.app.ui.components.TickerCarousel
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import me.sidequest.app.data.model.Profile
import me.sidequest.app.data.model.SiteTag
import me.sidequest.app.data.model.StickerPalette
import me.sidequest.app.ui.profile.ProfileState
import me.sidequest.app.ui.profile.ProfileViewModel

// [SQ.M-A-2603-0023] [SQ.M-A-2603-0026] [SQ.M-A-2603-0033]

@Composable
fun ProfileScreen(
    onEditProfile: () -> Unit = {},
    onTagClick   : (tag: String) -> Unit = {},
    viewModel    : ProfileViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()

    Scaffold(
        floatingActionButton = {
            if (state is ProfileState.Success && (state as ProfileState.Success).isOwner) {
                SmallFloatingActionButton(onClick = onEditProfile) {
                    Icon(Icons.Filled.Edit, contentDescription = "Edit profile")
                }
            }
        },
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
        ) {
            when (val s = state) {
                is ProfileState.Loading -> {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                }

                is ProfileState.Error -> {
                    Text(
                        text = s.message,
                        color = MaterialTheme.colorScheme.error,
                        modifier = Modifier
                            .align(Alignment.Center)
                            .padding(horizontal = 24.dp),
                    )
                }

                is ProfileState.Success -> {
                    ProfileContent(
                        profile    = s.profile,
                        onTagClick = onTagClick,
                        modifier   = Modifier.fillMaxSize(),
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun ProfileContent(
    profile    : Profile,
    onTagClick : (String) -> Unit,
    modifier   : Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp, vertical = 32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        // ── Avatar ────────────────────────────────────────────────────────
        if (!profile.avatarUrl.isNullOrBlank()) {
            AsyncImage(
                model = profile.avatarUrl,
                contentDescription = "Avatar",
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .size(96.dp)
                    .clip(CircleShape),
            )
        } else {
            Box(
                modifier = Modifier
                    .size(96.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.surfaceVariant),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = Icons.Filled.Person,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(48.dp),
                )
            }
        }

        Spacer(modifier = Modifier.height(4.dp))

        // ── Name & handle ─────────────────────────────────────────────────
        if (!profile.displayName.isNullOrBlank()) {
            Text(
                text = profile.displayName,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
            )
        }
        Text(
            text = "@${profile.username}",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        // ── Bio ───────────────────────────────────────────────────────────
        if (!profile.bio.isNullOrBlank()) {
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = profile.bio,
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.fillMaxWidth(),
            )
        }

        // ── Ticker carousel ───────────────────────────────────────────────
        val items = profile.tickerItems
        if (profile.tickerEnabled == true && !items.isNullOrEmpty()) {
            Spacer(modifier = Modifier.height(4.dp))
            TickerCarousel(
                items    = items,
                modifier = Modifier.fillMaxWidth(),
            )
        }

        // ── Likes & Dislikes ──────────────────────────────────────────────
        val likes    = profile.likes
        val dislikes = profile.dislikes
        if (!likes.isNullOrEmpty() || !dislikes.isNullOrEmpty()) {
            Spacer(modifier = Modifier.height(8.dp))

            if (!likes.isNullOrEmpty()) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Icon(
                        imageVector = Icons.Filled.ThumbUp,
                        contentDescription = "Likes",
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(16.dp),
                    )
                    Text(
                        text  = "Likes",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary,
                    )
                }
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    likes.forEach { item ->
                        AssistChip(onClick = {}, label = { Text(item) })
                    }
                }
            }

            if (!dislikes.isNullOrEmpty()) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Icon(
                        imageVector = Icons.Filled.ThumbDown,
                        contentDescription = "Dislikes",
                        tint = MaterialTheme.colorScheme.error,
                        modifier = Modifier.size(16.dp),
                    )
                    Text(
                        text  = "Dislikes",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.error,
                    )
                }
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    dislikes.forEach { item ->
                        AssistChip(onClick = {}, label = { Text(item) })
                    }
                }
            }
        }

        // ── Site Tags ─────────────────────────────────────────────────────
        val siteTags = profile.siteTags
        if (!siteTags.isNullOrEmpty()) {
            Spacer(modifier = Modifier.height(8.dp))
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement   = Arrangement.spacedBy(8.dp),
                modifier              = Modifier.fillMaxWidth(),
            ) {
                siteTags.forEach { tag ->
                    SiteTagChip(tag = tag, onClick = { onTagClick(tag.label) })
                }
            }
        }
    }
}

/** A coloured sticker chip that mirrors the web palette. Tap → filtered photowall. */
@Composable
private fun SiteTagChip(
    tag    : SiteTag,
    onClick: () -> Unit,
) {
    val style = StickerPalette.styleFor(tag.color)
    Surface(
        onClick      = onClick,
        color        = style.background,
        shape        = RoundedCornerShape(50),   // pill shape
        tonalElevation = 0.dp,
    ) {
        Text(
            text  = tag.label,
            color = style.textColor,
            style = MaterialTheme.typography.labelMedium,
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp),
        )
    }
}
