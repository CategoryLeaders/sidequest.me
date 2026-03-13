package me.sidequest.app.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.itemsIndexed
import androidx.compose.foundation.lazy.grid.rememberLazyGridState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import me.sidequest.app.data.model.Photo
import me.sidequest.app.ui.photowall.PhotowallState
import me.sidequest.app.ui.photowall.PhotowallViewModel

// [SQ.M-A-2603-0027] [SQ.M-A-2603-0033]

private const val LOAD_MORE_THRESHOLD = 6

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PhotowallScreen(
    onPhotoClick : (photoIndex: Int) -> Unit = {},
    onBack       : (() -> Unit)? = null,     // non-null when opened from a tag chip [SQ.M-A-2603-0033]
    viewModel    : PhotowallViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()

    Column(modifier = Modifier.fillMaxSize()) {
        // Show a TopAppBar with tag name + back arrow when browsing a filtered view
        val activeTag = (state as? PhotowallState.Content)?.activeTag
        if (onBack != null && activeTag != null) {
            TopAppBar(
                title = { Text(activeTag) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector        = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                        )
                    }
                }
            )
        }

        when (val s = state) {
            is PhotowallState.Loading -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }

            is PhotowallState.Error -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(
                        text     = s.message,
                        color    = MaterialTheme.colorScheme.error,
                        modifier = Modifier.padding(horizontal = 24.dp),
                    )
                }
            }

            is PhotowallState.Content -> {
                PhotoGrid(
                    photos        = s.photos,
                    isLoadingMore = s.isLoadingMore,
                    onPhotoClick  = onPhotoClick,
                    onLoadMore    = viewModel::loadMore,
                    modifier      = Modifier.weight(1f),
                )
            }
        }
    }
}

@Composable
private fun PhotoGrid(
    photos       : List<Photo>,
    isLoadingMore: Boolean,
    onPhotoClick : (index: Int) -> Unit,
    onLoadMore   : () -> Unit,
    modifier     : Modifier = Modifier,
) {
    val gridState = rememberLazyGridState()

    // Trigger loadMore when close to the end of the list
    val shouldLoadMore by remember {
        derivedStateOf {
            val layoutInfo  = gridState.layoutInfo
            val totalItems  = layoutInfo.totalItemsCount
            val lastVisible = layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
            totalItems > 0 && lastVisible >= totalItems - LOAD_MORE_THRESHOLD
        }
    }
    LaunchedEffect(shouldLoadMore) {
        if (shouldLoadMore) onLoadMore()
    }

    LazyVerticalGrid(
        columns     = GridCells.Fixed(3),
        state       = gridState,
        modifier    = modifier.fillMaxSize(),
        horizontalArrangement = Arrangement.spacedBy(2.dp),
        verticalArrangement   = Arrangement.spacedBy(2.dp),
    ) {
        itemsIndexed(photos, key = { _, p -> p.id }) { index, photo ->
            PhotoThumbnail(
                photo    = photo,
                onClick  = { onPhotoClick(index) },
            )
        }

        // Loading indicator at the bottom
        if (isLoadingMore) {
            item(span = { GridItemSpan(maxLineSpan) }) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp), strokeWidth = 2.dp)
                }
            }
        }
    }
}

@Composable
private fun PhotoThumbnail(
    photo  : Photo,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    AsyncImage(
        model              = photo.imageUrl,
        contentDescription = photo.caption,
        contentScale       = ContentScale.Crop,
        modifier           = modifier
            .aspectRatio(1f)
            .clickable(onClick = onClick),
    )
}
