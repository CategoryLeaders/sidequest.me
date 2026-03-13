package me.sidequest.app.ui.editprofile

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import me.sidequest.app.data.model.Profile
import me.sidequest.app.data.model.ProfileUpdate
import me.sidequest.app.data.repository.ProfileRepository
import javax.inject.Inject

// [SQ.M-A-2603-0024] [SQ.M-A-2603-0025] [SQ.M-A-2603-0026]

sealed interface EditProfileState {
    data object Loading   : EditProfileState
    data object Saving    : EditProfileState
    data object Saved     : EditProfileState
    data class  Ready(
        val displayName   : String,
        val bio           : String,
        val avatarUrl     : String,
        val pendingAvatar : Uri? = null,
        val tickerItems   : List<String> = emptyList(),
        val tickerEnabled : Boolean = true,
        val newTickerItem : String = "",
        val likes         : List<String> = emptyList(),
        val dislikes      : List<String> = emptyList(),
        val newLike       : String = "",
        val newDislike    : String = "",
    ) : EditProfileState
    data class Error(val message: String) : EditProfileState
}

@HiltViewModel
class EditProfileViewModel @Inject constructor(
    private val supabase   : SupabaseClient,
    private val repository : ProfileRepository,
) : ViewModel() {

    private val _state = MutableStateFlow<EditProfileState>(EditProfileState.Loading)
    val state: StateFlow<EditProfileState> = _state.asStateFlow()

    init {
        loadProfile()
    }

    private fun loadProfile() {
        viewModelScope.launch {
            _state.value = EditProfileState.Loading
            val userId = supabase.auth.currentUserOrNull()?.id
            if (userId == null) {
                _state.value = EditProfileState.Error("Not logged in")
                return@launch
            }
            val profile = repository.getProfileById(userId)
            _state.value = if (profile != null) {
                EditProfileState.Ready(
                    displayName   = profile.displayName   ?: "",
                    bio           = profile.bio           ?: "",
                    avatarUrl     = profile.avatarUrl     ?: "",
                    tickerItems   = profile.tickerItems   ?: emptyList(),
                    tickerEnabled = profile.tickerEnabled ?: true,
                    likes         = profile.likes         ?: emptyList(),
                    dislikes      = profile.dislikes      ?: emptyList(),
                )
            } else {
                EditProfileState.Error("Profile not found")
            }
        }
    }

    fun onDisplayNameChange(value: String) {
        val s = _state.value
        if (s is EditProfileState.Ready) _state.value = s.copy(displayName = value)
    }

    fun onBioChange(value: String) {
        val s = _state.value
        if (s is EditProfileState.Ready) _state.value = s.copy(bio = value)
    }

    /** Called when the user picks an image from the system photo picker. */
    fun onAvatarPicked(uri: Uri) {
        val s = _state.value
        if (s is EditProfileState.Ready) _state.value = s.copy(pendingAvatar = uri)
    }

    fun onTickerEnabledChange(enabled: Boolean) {
        val s = _state.value
        if (s is EditProfileState.Ready) _state.value = s.copy(tickerEnabled = enabled)
    }

    fun onNewTickerItemChange(value: String) {
        val s = _state.value
        if (s is EditProfileState.Ready) _state.value = s.copy(newTickerItem = value)
    }

    fun addTickerItem() {
        val s = _state.value as? EditProfileState.Ready ?: return
        val trimmed = s.newTickerItem.trim()
        if (trimmed.isBlank()) return
        _state.value = s.copy(
            tickerItems   = s.tickerItems + trimmed,
            newTickerItem = "",
        )
    }

    fun removeTickerItem(index: Int) {
        val s = _state.value as? EditProfileState.Ready ?: return
        _state.value = s.copy(tickerItems = s.tickerItems.toMutableList().also { it.removeAt(index) })
    }

    fun onNewLikeChange(value: String) {
        val s = _state.value as? EditProfileState.Ready ?: return
        _state.value = s.copy(newLike = value)
    }
    fun addLike() {
        val s = _state.value as? EditProfileState.Ready ?: return
        val trimmed = s.newLike.trim()
        if (trimmed.isBlank()) return
        _state.value = s.copy(likes = s.likes + trimmed, newLike = "")
    }
    fun removeLike(index: Int) {
        val s = _state.value as? EditProfileState.Ready ?: return
        _state.value = s.copy(likes = s.likes.toMutableList().also { it.removeAt(index) })
    }

    fun onNewDislikeChange(value: String) {
        val s = _state.value as? EditProfileState.Ready ?: return
        _state.value = s.copy(newDislike = value)
    }
    fun addDislike() {
        val s = _state.value as? EditProfileState.Ready ?: return
        val trimmed = s.newDislike.trim()
        if (trimmed.isBlank()) return
        _state.value = s.copy(dislikes = s.dislikes + trimmed, newDislike = "")
    }
    fun removeDislike(index: Int) {
        val s = _state.value as? EditProfileState.Ready ?: return
        _state.value = s.copy(dislikes = s.dislikes.toMutableList().also { it.removeAt(index) })
    }

    /**
     * Saves text fields via [ProfileRepository.updateProfile], which handles
     * online/offline routing automatically.
     * Avatar upload to Supabase Storage is a TODO — requires a signed upload
     * URL (via Edge Function per architecture decision).
     */
    fun save() {
        val s = _state.value as? EditProfileState.Ready ?: return
        viewModelScope.launch {
            _state.value = EditProfileState.Saving
            val userId = supabase.auth.currentUserOrNull()?.id
            if (userId == null) {
                _state.value = EditProfileState.Error("Not logged in")
                return@launch
            }

            // TODO [SQ.M-A-2603-0024]: upload s.pendingAvatar via Edge Function, get back URL
            val avatarUrl = s.avatarUrl   // unchanged until upload is implemented

            val update = ProfileUpdate(
                displayName   = s.displayName.trim().ifBlank { null },
                bio           = s.bio.trim().ifBlank { null },
                avatarUrl     = avatarUrl.ifBlank { null },
                tickerItems   = s.tickerItems.ifEmpty { null },
                tickerEnabled = s.tickerEnabled,
                likes         = s.likes.ifEmpty { null },
                dislikes      = s.dislikes.ifEmpty { null },
            )

            val ok = repository.updateProfile(userId, update)
            _state.value = if (ok) EditProfileState.Saved
                           else    EditProfileState.Error("Save failed — will retry when online")
        }
    }
}
