package me.sidequest.app.data.repository

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Columns
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import me.sidequest.app.data.model.Profile
import me.sidequest.app.data.network.NetworkMonitor
import me.sidequest.app.data.sync.SyncQueueRepository
import me.sidequest.app.data.local.SyncType
import me.sidequest.app.data.model.ProfileUpdate
import javax.inject.Inject
import javax.inject.Singleton

// [SQ.M-A-2603-0023] [SQ.M-A-2603-0031]

@Singleton
class ProfileRepository @Inject constructor(
    private val supabase      : SupabaseClient,
    private val networkMonitor: NetworkMonitor,
    private val syncQueue     : SyncQueueRepository,
) {
    /** Fetch a single profile by user UUID. Returns null if not found. */
    suspend fun getProfileById(userId: String): Profile? =
        runCatching {
            supabase.postgrest["profiles"]
                .select(Columns.ALL) {
                    filter { eq("id", userId) }
                }
                .decodeSingle<Profile>()
        }.getOrNull()

    /**
     * Persist a profile update.
     *
     * - **Online**: writes directly to Supabase.
     * - **Offline**: enqueues a [SyncType.PROFILE_UPDATE] entry; the
     *   [me.sidequest.app.work.SyncWorker] will retry on next reconnect.
     *
     * @return `true` if the update was applied or queued successfully.
     */
    suspend fun updateProfile(userId: String, update: ProfileUpdate): Boolean {
        return if (networkMonitor.isOnlineNow()) {
            runCatching {
                supabase.postgrest["profiles"].update(update) {
                    filter { eq("id", userId) }
                }
            }.isSuccess
        } else {
            val payload = Json.encodeToString(update)
            runCatching { syncQueue.enqueue(SyncType.PROFILE_UPDATE, payload) }.isSuccess
        }
    }
}
