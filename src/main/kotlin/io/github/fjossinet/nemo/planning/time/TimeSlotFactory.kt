package io.github.fjossinet.nemo.planning.time

import java.time.DayOfWeek

class TimeSlotFactory(
    private val week:String,
    private val day: DayOfWeek,
    private val dayStart: Int,
    private val dayEnd: Int,
    private val step: Int
) {

    fun generate(durationMinutes: Int, forbiddenSlot:Pair<Int,Int> = Pair(721,779)): List<TimeSlot> {
        val slots = mutableListOf<TimeSlot>()
        var start = dayStart
        while (start + durationMinutes <= dayEnd) {
            if (forbiddenSlot.first in start..start+durationMinutes || forbiddenSlot.second in start..start+durationMinutes) {
                //not allowed
            } else {
                slots += TimeSlot(week, day, start, durationMinutes)
            }
            start += step
        }
        return slots
    }
}