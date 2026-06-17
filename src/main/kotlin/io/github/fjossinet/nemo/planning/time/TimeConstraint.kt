package io.github.fjossinet.nemo.planning.time

import java.time.DayOfWeek

data class TimeConstraint(val week: String, val day: DayOfWeek, val startMinutes: Int, val endMinutes: Int)