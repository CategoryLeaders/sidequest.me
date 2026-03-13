package me.sidequest.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import me.sidequest.app.ui.screens.EditProfileScreen
import me.sidequest.app.ui.screens.FeedScreen
import me.sidequest.app.ui.screens.LightboxScreen
import me.sidequest.app.ui.screens.LoginScreen
import me.sidequest.app.ui.screens.PhotowallScreen
import me.sidequest.app.ui.screens.ProfileScreen
import me.sidequest.app.ui.screens.WritingDetailScreen
import me.sidequest.app.ui.screens.WritingsScreen
import java.net.URLDecoder
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

// [SQ.M-A-2603-0021] [SQ.M-A-2603-0024] [SQ.M-A-2603-0027] [SQ.M-A-2603-0029] [SQ.M-A-2603-0030] [SQ.M-A-2603-0033]

@Composable
fun SideQuestNavHost(
    navController: NavHostController,
    modifier: Modifier = Modifier,
) {
    NavHost(
        navController    = navController,
        startDestination = Screen.Login.route,
        modifier         = modifier,
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
            ProfileScreen(
                onEditProfile = { navController.navigate(Screen.EditProfile.route) },
                onTagClick    = { tag ->
                    navController.navigate(Screen.Photowall.routeFor(tag))
                },
            )
        }

        composable(Screen.EditProfile.route) {
            EditProfileScreen(
                onSaved = { navController.popBackStack() },
                onBack  = { navController.popBackStack() },
            )
        }

        // Photowall: optional "tag" arg — null = all photos, non-null = filtered
        composable(
            route     = Screen.Photowall.route,
            arguments = listOf(navArgument("tag") {
                type     = NavType.StringType
                nullable = true
                defaultValue = null
            }),
        ) { backStack ->
            val rawTag   = backStack.arguments?.getString("tag")
            val activeTag = rawTag?.let { URLDecoder.decode(it, StandardCharsets.UTF_8.name()) }
            PhotowallScreen(
                onPhotoClick = { index ->
                    navController.navigate(Screen.Lightbox.routeFor(index))
                },
                onBack = if (activeTag != null) {
                    { navController.popBackStack() }
                } else null,
            )
        }

        composable(
            route     = Screen.Lightbox.route,
            arguments = listOf(navArgument("index") {
                type = NavType.IntType
            }),
        ) { backStack ->
            val startIndex = backStack.arguments?.getInt("index") ?: 0
            LightboxScreen(
                startIndex = startIndex,
                onBack     = { navController.popBackStack() },
            )
        }

        composable(Screen.Writings.route) {
            WritingsScreen(
                onWritingClick = { id ->
                    navController.navigate(Screen.WritingDetail.routeFor(id))
                },
            )
        }

        composable(
            route     = Screen.WritingDetail.route,
            arguments = listOf(navArgument("id") {
                type = NavType.StringType
            }),
        ) {
            WritingDetailScreen(
                onBack = { navController.popBackStack() },
            )
        }

        composable(Screen.Feed.route) {
            FeedScreen()
        }
    }
}

sealed class Screen(val route: String) {
    data object Login       : Screen("login")
    data object Profile     : Screen("profile")
    data object EditProfile : Screen("edit_profile")

    /**
     * Photowall supports an optional tag filter.
     * Route: "photowall?tag={tag}" — tag is URL-encoded to handle spaces.
     */
    data object Photowall : Screen("photowall?tag={tag}") {
        /** Navigate to unfiltered photowall. */
        fun route() = "photowall"
        /** Navigate to photowall filtered by [tag]. */
        fun routeFor(tag: String) =
            "photowall?tag=${URLEncoder.encode(tag, StandardCharsets.UTF_8.name())}"
    }

    data object Lightbox : Screen("lightbox/{index}") {
        fun routeFor(index: Int) = "lightbox/$index"
    }

    data object Writings      : Screen("writings")
    data object WritingDetail : Screen("writing/{id}") {
        fun routeFor(id: String) = "writing/$id"
    }
    data object Feed          : Screen("feed")
}
