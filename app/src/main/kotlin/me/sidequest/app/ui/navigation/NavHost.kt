package me.sidequest.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import me.sidequest.app.ui.screens.FeedScreen
import me.sidequest.app.ui.screens.LoginScreen
import me.sidequest.app.ui.screens.ProfileScreen

@Composable
fun SideQuestNavHost(navController: NavHostController) {
    NavHost(
        navController = navController,
        startDestination = Screen.Login.route
    ) {
        composable(Screen.Login.route) {
            LoginScreen(
                onLoginClick = {
                    navController.navigate(Screen.Feed.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Feed.route) {
            FeedScreen()
        }

        composable(Screen.Profile.route) {
            ProfileScreen()
        }
    }
}

sealed class Screen(val route: String) {
    data object Login : Screen("login")
    data object Feed : Screen("feed")
    data object Profile : Screen("profile")
}
