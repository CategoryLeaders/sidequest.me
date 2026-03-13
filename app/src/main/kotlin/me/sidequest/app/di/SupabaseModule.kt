package me.sidequest.app.di

import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import javax.inject.Singleton

// [SQ.M-A-2603-0022]

private const val SUPABASE_URL = "https://loawjmjuwrjjgmedswro.supabase.co"

// anon/publishable key — safe to include in source for a personal project;
// move to local.properties → BuildConfig for multi-developer setups
private const val SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvYXdqbWp1d3JqamdtZWRzd3JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNzI0ODMsImV4cCI6MjA4ODc0ODQ4M30." +
    "p0JdMk1ksq-EkBpSVymCKTIazVMOYS7n5yYoAwYPbcM"

@Module
@InstallIn(SingletonComponent::class)
object SupabaseModule {

    @Provides
    @Singleton
    fun provideSupabaseClient(): SupabaseClient = createSupabaseClient(
        supabaseUrl = SUPABASE_URL,
        supabaseKey = SUPABASE_ANON_KEY,
    ) {
        install(Auth) {
            // Deep link scheme registered in AndroidManifest
            scheme = "sidequest"
            host   = "callback"
        }
        install(Postgrest)
    }
}
