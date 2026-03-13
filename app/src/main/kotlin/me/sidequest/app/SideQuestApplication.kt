package me.sidequest.app

import android.app.Application
import androidx.hilt.work.HiltWorkerFactory
import androidx.work.Configuration
import dagger.hilt.android.HiltAndroidApp
import javax.inject.Inject

// Required by Hilt for dependency injection initialisation.
// [SQ.M-A-2603-0031] HiltWorkerFactory wired so SyncWorker gets DI injection.

@HiltAndroidApp
class SideQuestApplication : Application(), Configuration.Provider {

    @Inject
    lateinit var workerFactory: HiltWorkerFactory

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setWorkerFactory(workerFactory)
            .build()
}
