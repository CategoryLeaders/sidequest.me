package me.sidequest.app

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

// Required by Hilt for dependency injection initialisation.

@HiltAndroidApp
class SideQuestApplication : Application()
