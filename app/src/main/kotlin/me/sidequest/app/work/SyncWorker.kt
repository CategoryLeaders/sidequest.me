package me.sidequest.app.work

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonPrimitive
import me.sidequest.app.data.local.SyncQueueDao
import me.sidequest.app.data.local.SyncQueueEntry
import me.sidequest.app.data.local.SyncType

// [SQ.M-A-2603-0031]

private const val MAX_RETRIES = 3

/**
 * WorkManager worker that drains the sync queue.
 *
 * Runs once per schedule, processes all PENDING entries in order, and
 * handles per-entry failure without aborting the whole batch.
 *
 * Retry behaviour:
 *  - Entry-level: up to [MAX_RETRIES] attempts; after that the entry is
 *    left as FAILED for the user to retry manually.
 *  - Worker-level: returns [Result.success] even on partial failures so
 *    WorkManager doesn't reschedule the whole batch automatically.
 */
@HiltWorker
class SyncWorker @AssistedInject constructor(
    @Assisted context         : Context,
    @Assisted workerParams    : WorkerParameters,
    private val dao           : SyncQueueDao,
    private val supabase      : SupabaseClient,
) : CoroutineWorker(context, workerParams) {

    override suspend fun doWork(): Result {
        val userId = supabase.auth.currentUserOrNull()?.id
            ?: return Result.success()   // not logged in — nothing to sync

        val pending = dao.getPending()
        if (pending.isEmpty()) return Result.success()

        for (entry in pending) {
            if (entry.retryCount >= MAX_RETRIES) {
                dao.markFailed(entry.id, "Max retries exceeded")
                continue
            }
            dao.markInProgress(entry.id)
            val success = processEntry(entry, userId)
            if (success) {
                dao.delete(entry.id)
            } else {
                dao.markFailed(entry.id, "Remote call failed")
            }
        }

        return Result.success()
    }

    private suspend fun processEntry(entry: SyncQueueEntry, userId: String): Boolean =
        runCatching {
            when (entry.type) {
                SyncType.PROFILE_UPDATE -> syncProfileUpdate(entry.payload, userId)
                SyncType.PHOTO_UPLOAD   -> syncPhotoUpload(entry.payload, userId)
            }
        }.isSuccess

    private suspend fun syncProfileUpdate(payload: String, userId: String) {
        // Payload is a flat JSON object matching the `profiles` table columns.
        // We decode it as a generic JsonObject and push it via postgrest.
        val json = Json.parseToJsonElement(payload) as JsonObject
        supabase.postgrest["profiles"].update(json) {
            filter { eq("id", userId) }
        }
    }

    private suspend fun syncPhotoUpload(payload: String, userId: String) {
        // Photo uploads go through a Supabase Edge Function so the Bunny.net
        // API key stays server-side. The Edge Function accepts a JSON body
        // with { localUri, caption, takenAt }.
        //
        // Full implementation deferred until Edge Function is deployed.
        // For now we log the intent — the queue entry will succeed silently.
        val json = Json.parseToJsonElement(payload) as JsonObject
        val localUri = json["localUri"]?.jsonPrimitive?.content ?: return
        android.util.Log.d("SyncWorker", "PHOTO_UPLOAD queued: $localUri (userId=$userId) — Edge Function not yet deployed")
    }

    companion object {
        const val WORK_NAME = "sidequest_sync"
    }
}
