package me.sidequest.app.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

// [SQ.M-A-2603-0031]

@Dao
interface SyncQueueDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(entry: SyncQueueEntry)

    /** All PENDING entries in insertion order — used by SyncWorker to drain queue. */
    @Query("SELECT * FROM sync_queue WHERE status = 'PENDING' ORDER BY createdAt ASC")
    suspend fun getPending(): List<SyncQueueEntry>

    /** Live count of PENDING entries, observed by the UI to show sync badge. */
    @Query("SELECT COUNT(*) FROM sync_queue WHERE status = 'PENDING'")
    fun observePendingCount(): Flow<Int>

    /** Live count of FAILED entries, observed so the UI can show a retry prompt. */
    @Query("SELECT COUNT(*) FROM sync_queue WHERE status = 'FAILED'")
    fun observeFailedCount(): Flow<Int>

    @Query("UPDATE sync_queue SET status = 'IN_PROGRESS' WHERE id = :id")
    suspend fun markInProgress(id: String)

    @Query("DELETE FROM sync_queue WHERE id = :id")
    suspend fun delete(id: String)

    @Query("""
        UPDATE sync_queue
        SET status = 'FAILED', retryCount = retryCount + 1, failReason = :reason
        WHERE id = :id
    """)
    suspend fun markFailed(id: String, reason: String?)

    /** Reset all FAILED entries back to PENDING so they get retried. */
    @Query("UPDATE sync_queue SET status = 'PENDING', failReason = NULL WHERE status = 'FAILED'")
    suspend fun retryAll()

    @Query("SELECT COUNT(*) FROM sync_queue WHERE status != 'FAILED'")
    suspend fun countActive(): Int
}
