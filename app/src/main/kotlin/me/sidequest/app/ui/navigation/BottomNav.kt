package me.sidequest.app.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PhotoLibrary
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavController
import androidx.navigation.compose.currentBackStackEntryAsState

// [SQ.M-A-2603-0021] [SQ.M-A-2603-0033]

data class BottomNavItem(
    val label      : String,
    val icon       : ImageVector,
    val screen     : Screen,
    /** The literal route string to navigate to when tapping the tab. */
    val navRoute   : String = screen.route,
    /** Route prefix used to determine if this tab is "selected". */
    val routePrefix: String = screen.route,
)

val bottomNavItems = listOf(
    BottomNavItem("Profile",  Icons.Filled.Person,       Screen.Profile),
    // Photowall base route is "photowall" (unfiltered); the registered route template is "photowall?tag={tag}"
    BottomNavItem(
        label       = "Photos",
        icon        = Icons.Filled.PhotoLibrary,
        screen      = Screen.Photowall,
        navRoute    = "photowall",
        routePrefix = "photowall",
    ),
    BottomNavItem("Writings", Icons.Filled.MenuBook,     Screen.Writings),
    BottomNavItem("Feed",     Icons.Filled.Home,         Screen.Feed),
)

/** Routes where the bottom nav should be hidden. */
val routesWithoutNav = setOf(
    Screen.Login.route,
    Screen.EditProfile.route,
    Screen.Lightbox.route,
    Screen.WritingDetail.route,
)

@Composable
fun SideQuestBottomBar(navController: NavController) {
    val currentEntry = navController.currentBackStackEntryAsState().value
    val currentRoute = currentEntry?.destination?.route

    NavigationBar {
        bottomNavItems.forEach { item ->
            // A tab is "selected" if the current route starts with its prefix
            val selected = currentRoute?.startsWith(item.routePrefix) == true
            NavigationBarItem(
                selected = selected,
                onClick = {
                    if (!selected) {
                        navController.navigate(item.navRoute) {
                            popUpTo(Screen.Profile.route) { saveState = true }
                            launchSingleTop = true
                            restoreState    = true
                        }
                    }
                },
                icon  = { Icon(item.icon, contentDescription = item.label) },
                label = { Text(item.label) },
            )
        }
    }
}
