package me.sidequest.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.runtime.Composable

// [SQ.M-A-2603-0021] stub — replaced with real auth in SQ.M-A-2603-0022

@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit = {},
) {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text("SideQuest.me")
        Button(onClick = onLoginSuccess) {
            Text("Sign in (stub)")
        }
    }
}
