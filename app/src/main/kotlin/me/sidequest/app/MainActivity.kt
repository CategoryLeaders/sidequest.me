package me.sidequest.app

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import dagger.hilt.android.AndroidEntryPoint
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.handleDeeplinks
import me.sidequest.app.ui.navigation.SideQuestBottomBar
import me.sidequest.app.ui.navigation.SideQuestNavHost
import me.sidequest.app.ui.navigation.routesWithoutNav
import me.sidequest.app.ui.theme.SideQuestTheme
import javax.inject.Inject

// [SQ.M-A-2603-0021] [SQ.M-A-2603-0022]

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject lateinit var supabase: SupabaseClient

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Handle a deep link that cold-launched the activity (e.g. magic-link email tap)
        supabase.handleDeeplinks(intent)

        setContent {
            SideQuestTheme {
                val navController = rememberNavController()
                val currentEntry by navController.currentBackStackEntryAsState()
                val currentRoute = currentEntry?.destination?.route
                val showBottomBar = currentRoute !in routesWithoutNav

                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    bottomBar = {
                        if (showBottomBar) {
                            SideQuestBottomBar(navController = navController)
                        }
                    }
                ) { innerPadding ->
                    SideQuestNavHost(
                        navController = navController,
                        modifier = Modifier.padding(innerPadding),
                    )
                }
            }
        }
    }

    /** Handle deep links arriving while the activity is already running. */
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        supabase.handleDeeplinks(intent)
    }
}
