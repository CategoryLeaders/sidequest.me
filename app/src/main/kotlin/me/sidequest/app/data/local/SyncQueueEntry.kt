package me.sidequest.app.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.util.UUID

// [SQ.M-A-2603-0031]

/** Type of operation waiting to be synced to Supabase. */
enum class SyncType {
    PROFILE_UPDATE,
    PHOTO_UPLOAD,
}

/** Status of a sync queue entry. */
enum class SyncStatus {
    PENDING,
    IN_PROGRESS,
    FAILED,
}

/**
 * A pending write operation that could not be sent to Supabase while offline.
 *
 * [payload] is a JSON-encoded string whose schema depends on [type]:
 *  - PROFILE_UPDATE → serialized ProfileUpdate fields
 *  - PHOTO_UPLOAD   → local URI + optional caption
 */
@Entity(tableName = "sync_queue")
data class SyncQueueEntry(
    @PrimaryKey
    val id         : String     = UUID.randomUUID().toString(),
    val type       : SyncType   = SyncType.PROFILE_UPDATE,
    val payload    : String     = "{}",
    val status     : SyncStatus = SyncStatus.PENDING,
    val retryCount : Int        = 0,
    val createdAt  : Long       = System.currentTimeMillis(),
    val failReason : String?    = null,
)
