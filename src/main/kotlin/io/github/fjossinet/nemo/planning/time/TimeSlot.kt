package io.github.fjossinet.nemo.planning.time

import java.time.DayOfWeek

data class TimeSlot(
    val week: String,
    val day: DayOfWeek,
    val startMinutes: Int,  // minutes depuis 00:00
    val durationMinutes: Int
) {
    val endMinutes: Int
        get() = startMinutes + durationMinutes

    override fun toString(): String =
        "${week} ${dayLabel()} ${formatTime(startMinutes)}–${formatTime(endMinutes)}"

    private fun formatTime(minutes: Int): String {
        val h = minutes / 60
        val m = minutes % 60
        return "%02d:%02d".format(h, m)
    }

    private fun dayLabel(): String =
        day.name.lowercase().replaceFirstChar { it.uppercase() }
}