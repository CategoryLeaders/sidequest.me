package me.sidequest.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import me.sidequest.app.ui.screens.FeedScreen
import me.sidequest.app.ui.screens.LoginScreen
import me.sidequest.app.ui.screens.PhotowallScreen
import me.sidequest.app.ui.screens.ProfileScreen
import me.sidequest.app.ui.screens.WritingsScreen

// [SQ.M-A-2603-0021]

@Composable
fun SideQuestNavHost(
    navController: NavHostController,
    modifier: Modifier = Modifier,
) {
    NavHost(
        navController = navController,
        startDestination = Screen.Login.route,
        modifier = modifier,
    ) {
        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Screen.Profile.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Profile.route) {
            ProfileScreen()
        }

        composable(Screen.Photowall.route) {
            PhotowallScreen()
        }

        composable(Screen.Writings.route) {
            WritingsScreen()
        }

        composable(Screen.Feed.route) {
            FeedScreen()
        }
    }
}

sealed class Screen(val route: String) {
    data object Login    : Screen("login")
    data object Profile  : Screen("profile")
    data object Photowall: Screen("photowall")
    data object Writings : Screen("writings")
    data object Feed     : Screen("feed")
}
