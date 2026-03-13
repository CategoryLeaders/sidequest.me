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

// [SQ.M-A-2603-0021]

data class BottomNavItem(
    val label: String,
    val icon: ImageVector,
    val screen: Screen,
)

val bottomNavItems = listOf(
    BottomNavItem("Profile",  Icons.Filled.Person,       Screen.Profile),
    BottomNavItem("Photos",   Icons.Filled.PhotoLibrary, Screen.Photowall),
    BottomNavItem("Writings", Icons.Filled.MenuBook,     Screen.Writings),
    BottomNavItem("Feed",     Icons.Filled.Home,         Screen.Feed),
)

/** Routes where the bottom nav should be hidden. */
val routesWithoutNav = setOf(Screen.Login.route)

@Composable
fun SideQuestBottomBar(navController: NavController) {
    val currentEntry = navController.currentBackStackEntryAsState().value
    val currentRoute = currentEntry?.destination?.route

    NavigationBar {
        bottomNavItems.forEach { item ->
            NavigationBarItem(
                selected = currentRoute == item.screen.route,
                onClick = {
                    if (currentRoute != item.screen.route) {
                        navController.navigate(item.screen.route) {
                            // Avoid building up a large back stack
                            popUpTo(Screen.Profile.route) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                },
                icon = { Icon(item.icon, contentDescription = item.label) },
                label = { Text(item.label) },
            )
        }
    }
}
