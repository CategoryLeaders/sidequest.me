package me.sidequest.app.data.network

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.distinctUntilChanged
import javax.inject.Inject
import javax.inject.Singleton

// [SQ.M-A-2603-0031]

/**
 * Wraps [ConnectivityManager] as a [Flow<Boolean>] that emits `true` when
 * the device has an internet-capable network and `false` when it doesn't.
 *
 * Collectors receive the current state immediately on subscription, then
 * any subsequent changes.
 */
@Singleton
class NetworkMonitor @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    val isOnline: Flow<Boolean> = callbackFlow {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

        val callback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                trySend(true)
            }
            override fun onLost(network: Network) {
                // Check if any other usable network still exists
                trySend(cm.isCurrentlyOnline())
            }
            override fun onCapabilitiesChanged(
                network     : Network,
                capabilities: NetworkCapabilities,
            ) {
                trySend(capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET))
            }
        }

        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()

        cm.registerNetworkCallback(request, callback)

        // Emit current state immediately
        trySend(cm.isCurrentlyOnline())

        awaitClose { cm.unregisterNetworkCallback(callback) }
    }.distinctUntilChanged()

    /** Synchronous check — use in non-coroutine contexts (e.g. WorkManager). */
    fun isOnlineNow(): Boolean {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        return cm.isCurrentlyOnline()
    }
}

private fun ConnectivityManager.isCurrentlyOnline(): Boolean =
    activeNetwork
        ?.let { getNetworkCapabilities(it) }
        ?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        ?: false
