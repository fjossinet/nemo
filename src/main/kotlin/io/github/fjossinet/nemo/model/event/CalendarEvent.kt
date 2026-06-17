package io.github.fjossinet.nemo.model.event

import java.time.DayOfWeek

data class CalendarEvent(
    val teachingId:String,
    val groupId: Int,
    val sessionId: Int,
    val day: DayOfWeek? = null, //null if no timeslot found
    val startMinutes: Int? = null, //null if no timeslot found
    val endMinutes: Int? = null, //null if no timeslot found
    val studentIds: MutableSet<String> = mutableSetOf(),
    var error: String? = null,
    val week:String? = null
)
