package me.sidequest.app.data.local

import androidx.room.Database
import androidx.room.RoomDatabase

// [SQ.M-A-2603-0031]

@Database(
    entities  = [SyncQueueEntry::class],
    version   = 1,
    exportSchema = false,
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun syncQueueDao(): SyncQueueDao
}
