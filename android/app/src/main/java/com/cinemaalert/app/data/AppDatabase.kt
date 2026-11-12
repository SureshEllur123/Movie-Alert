package com.cinemaalert.app.data

import android.content.Context
import androidx.room.*

@Entity(tableName = "trackers")
data class TrackerEntity(
    @PrimaryKey val id: String,
    val movieName: String,
    val selectedDatesJson: String,
    val timeFilterJson: String,
    val language: String,
    val city: String,
    val theatresJson: String,
    val platformsJson: String,
    val alertPreferencesJson: String,
    val monitoringIntervalMinutes: Int,
    val isActive: Boolean,
    val createdAt: Long,
    val updatedAt: Long,
    val lastCheckedAt: Long = 0L,
    val discoveredShowsCount: Int = 0,
    val newSeatsAlertsCount: Int = 0
)

@Entity(tableName = "shows")
data class ShowEntity(
    @PrimaryKey val id: String,
    val trackerId: String,
    val movieName: String,
    val theatreName: String,
    val date: String,
    val time: String,
    val time24: String,
    val language: String,
    val format: String,
    val platform: String,
    val bookingUrl: String,
    val availability: String,
    val availableSeatsCount: Int,
    val totalSeatsCount: Int,
    val lastChecked: Long
)

@Dao
interface TrackerDao {
    @Query("SELECT * FROM trackers WHERE isActive = 1")
    suspend fun getActiveTrackers(): List<TrackerEntity>

    @Query("SELECT * FROM trackers WHERE id = :id")
    suspend fun getTrackerById(id: String): TrackerEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTracker(tracker: TrackerEntity)

    @Query("UPDATE trackers SET lastCheckedAt = :timestamp WHERE id = :id")
    suspend fun updateLastChecked(id: String, timestamp: Long)

    @Delete
    suspend fun deleteTracker(tracker: TrackerEntity)
}

@Database(entities = [TrackerEntity::class, ShowEntity::class], version = 1, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun trackerDao(): TrackerDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "cinema_alert_database.db"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
