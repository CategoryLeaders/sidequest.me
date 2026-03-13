package me.sidequest.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import kotlinx.coroutines.launch
import me.sidequest.app.auth.AuthState
import me.sidequest.app.auth.AuthViewModel

// [SQ.M-A-2603-0022]

@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit = {},
    viewModel: AuthViewModel = hiltViewModel(),
) {
    val authState by viewModel.authState.collectAsState()
    val snackbar = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    var email by remember { mutableStateOf("") }
    var magicLinkSent by remember { mutableStateOf(false) }
    var sendingLink by remember { mutableStateOf(false) }

    // Navigate out once authenticated
    LaunchedEffect(authState) {
        if (authState is AuthState.Authenticated) onLoginSuccess()
    }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 32.dp)
                .align(Alignment.Center),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            // Wordmark
            Text(
                text = "SideQuest.me",
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.Black,
                textAlign = TextAlign.Center,
            )
            Text(
                text = "Sophie's corner of the internet",
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            Spacer(modifier = Modifier.height(8.dp))

            if (authState is AuthState.Loading) {
                CircularProgressIndicator()
            } else {
                // ── Google OAuth ──────────────────────────────────────
                Button(
                    onClick = { viewModel.signInWithGoogle() },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text("Sign in with Google")
                }

                HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))

                // ── Magic Link ────────────────────────────────────────
                if (magicLinkSent) {
                    Text(
                        text = "✉️ Check your email — a sign-in link is on its way.",
                        style = MaterialTheme.typography.bodyMedium,
                        textAlign = TextAlign.Center,
                        color = MaterialTheme.colorScheme.primary,
                    )
                    OutlinedButton(
                        onClick = { magicLinkSent = false },
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text("Use a different email")
                    }
                } else {
                    val onSend: () -> Unit = {
                        if (email.isNotBlank()) {
                            sendingLink = true
                            scope.launch {
                                val ok = viewModel.sendMagicLink(email.trim())
                                sendingLink = false
                                if (ok) {
                                    magicLinkSent = true
                                } else {
                                    snackbar.showSnackbar(
                                        "Couldn't send link — check the email address"
                                    )
                                }
                            }
                        }
                    }

                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it },
                        label = { Text("Email address") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Email,
                            imeAction = ImeAction.Send,
                        ),
                        keyboardActions = KeyboardActions(onSend = { onSend() }),
                    )
                    OutlinedButton(
                        onClick = onSend,
                        enabled = email.isNotBlank() && !sendingLink,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        if (sendingLink) {
                            CircularProgressIndicator(
                                modifier = Modifier.height(18.dp),
                                strokeWidth = 2.dp,
                            )
                        } else {
                            Text("Send sign-in link")
                        }
                    }
                }
            }
        }

        SnackbarHost(
            hostState = snackbar,
            modifier = Modifier.align(Alignment.BottomCenter),
        )
    }
}
