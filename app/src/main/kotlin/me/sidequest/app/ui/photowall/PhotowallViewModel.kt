package me.sidequest.app.ui.photowall

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import me.sidequest.app.data.model.Photo
import me.sidequest.app.data.repository.PhotoRepository
import javax.inject.Inject

// [SQ.M-A-2603-0027] [SQ.M-A-2603-0033]

sealed interface PhotowallState {
    data object Loading                                    : PhotowallState
    data class  Content(
        val photos        : List<Photo>,
        val isLoadingMore : Boolean = false,
        val hasMore       : Boolean = true,
        val activeTag     : String? = null,  // [SQ.M-A-2603-0033] active tag filter label
    ) : PhotowallState
    data class  Error(val message: String)                 : PhotowallState
}

@HiltViewModel
class PhotowallViewModel @Inject constructor(
    private val supabase         : SupabaseClient,
    private val repository       : PhotoRepository,
    private val savedStateHandle : SavedStateHandle,
) : ViewModel() {

    /** Optional tag filter passed via NavHost route arg "tag". Null = show all. */
    private val filterTag: String? = savedStateHandle["tag"]

    private val _state = MutableStateFlow<PhotowallState>(PhotowallState.Loading)
    val state: StateFlow<PhotowallState> = _state.asStateFlow()

    private var currentPage = 0

    init {
        load()
    }

    private fun load() {
        viewModelScope.launch {
            _state.value = PhotowallState.Loading
            val userId = supabase.auth.currentUserOrNull()?.id
            if (userId == null) {
                _state.value = PhotowallState.Error("Not logged in")
                return@launch
            }
            val photos = repository.getPhotos(userId, page = 0, filterTag = filterTag)
            currentPage = 0
            _state.value = PhotowallState.Content(
                photos    = photos,
                hasMore   = photos.size == PhotoRepository.PAGE_SIZE,
                activeTag = filterTag,
            )
        }
    }

    /** Called when the grid nears the end — loads the next page. */
    fun loadMore() {
        val s = _state.value as? PhotowallState.Content ?: return
        if (s.isLoadingMore || !s.hasMore) return

        viewModelScope.launch {
            _state.value = s.copy(isLoadingMore = true)
            val userId = supabase.auth.currentUserOrNull()?.id ?: run {
                _state.value = PhotowallState.Error("Not logged in")
                return@launch
            }
            val nextPage = currentPage + 1
            val more     = repository.getPhotos(userId, page = nextPage, filterTag = filterTag)
            currentPage  = nextPage
            _state.value = s.copy(
                photos        = s.photos + more,
                isLoadingMore = false,
                hasMore       = more.size == PhotoRepository.PAGE_SIZE,
            )
        }
    }

    fun refresh() = load()
}
