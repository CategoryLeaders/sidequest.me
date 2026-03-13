package me.sidequest.app.data.sync

import android.content.Context
import androidx.work.Constraints
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import me.sidequest.app.data.local.SyncQueueDao
import me.sidequest.app.data.local.SyncQueueEntry
import me.sidequest.app.data.local.SyncType
import me.sidequest.app.work.SyncWorker
import javax.inject.Inject
import javax.inject.Singleton

// [SQ.M-A-2603-0031]

/**
 * Facade over [SyncQueueDao] and [WorkManager].
 *
 * Callers (repositories) use [enqueue] to queue a write when the device is
 * offline. After insertion, a [SyncWorker] is scheduled to run as soon as a
 * network connection becomes available.
 */
@Singleton
class SyncQueueRepository @Inject constructor(
    private val dao    : SyncQueueDao,
    @ApplicationContext private val context: Context,
) {
    /** How many items are waiting to be synced. */
    val pendingCount: Flow<Int> = dao.observePendingCount()

    /** How many items have permanently failed (after max retries). */
    val failedCount: Flow<Int> = dao.observeFailedCount()

    /**
     * Queue a single write operation for later sync.
     * Schedules [SyncWorker] immediately (it will wait for network).
     */
    suspend fun enqueue(type: SyncType, payload: String) {
        dao.insert(SyncQueueEntry(type = type, payload = payload))
        scheduleSyncWorker()
    }

    /** Reset all failed entries to PENDING and kick off a sync attempt. */
    suspend fun retryFailed() {
        dao.retryAll()
        scheduleSyncWorker()
    }

    /** Explicitly trigger a sync attempt (e.g. after login). */
    fun triggerSync() = scheduleSyncWorker()

    private fun scheduleSyncWorker() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val request = OneTimeWorkRequestBuilder<SyncWorker>()
            .setConstraints(constraints)
            .build()

        // KEEP so a second enqueue while one is already queued does nothing
        WorkManager.getInstance(context).enqueueUniqueWork(
            SyncWorker.WORK_NAME,
            ExistingWorkPolicy.KEEP,
            request,
        )
    }
}
