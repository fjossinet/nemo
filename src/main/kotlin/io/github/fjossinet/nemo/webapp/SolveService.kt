package io.github.fjossinet.nemo.webapp

import io.github.fjossinet.nemo.model.event.CalendarEvent
import io.github.fjossinet.nemo.model.people.Student
import io.github.fjossinet.nemo.model.teaching.Teaching
import io.github.fjossinet.nemo.model.teaching.TeachingGroup
import io.github.fjossinet.nemo.model.teaching.TeachingType
import io.github.fjossinet.nemo.planning.conflict.ConflictGraphBuilder
import io.github.fjossinet.nemo.planning.grouping.GroupingService
import io.github.fjossinet.nemo.planning.grouping.PivotStrategy
import io.github.fjossinet.nemo.planning.solver.Solver
import io.github.fjossinet.nemo.planning.time.TimeConstraint
import io.github.fjossinet.nemo.planning.time.TimeSlot
import io.github.fjossinet.nemo.planning.time.TimeSlotFactory
import java.time.DayOfWeek


class SolveService {

    fun solveFromJson(data: Map<String, Any>, currentWeek:String): Map<TeachingGroup, TimeSlot?> {
        var solution: MutableMap<TeachingGroup, TimeSlot?>
        val teachingUnitIdToStudents = parseStudents(data["students"] as List<Map<String, Any>>)
        val pivotStrategy = parsePivotStrategy(data["settings"] as Map<String, Any>) ?: PivotStrategy.MOST_CONSTRAINED

        val currentWeekTeachings = getInWeekTeachings(data["teachings"] as List<Map<String, Any>>, currentWeek)

        //using all the events fixed so far, some inWeek groups could be already assigned and will produce fixed assignments
        val allFixedEvents = parseFixedEvents(data["allFixedEvents"] as List<Map<String, Any>>)

        if (currentWeekTeachings.isEmpty()) {
            solution = mutableMapOf()
            //we add to the solution all the events fixed so far
            allFixedEvents.forEach {
                if (it.week!=null &&  it.day!=null && it.startMinutes!=null  && it.endMinutes!=null)
                    solution[TeachingGroup(it.teachingId, it.groupId, it.sessionId,it.studentIds)] = TimeSlot(it.week, it.day, it.startMinutes, it.endMinutes - it.startMinutes)
            }
            return solution
        }

        val currentWeekTeachingGroups = mutableListOf<TeachingGroup>()

        val groupingService = GroupingService(pivotStrategy)

        currentWeekTeachings.forEach{ teaching ->
            //we assign students to a teaching group
            teachingUnitIdToStudents[teaching.unitId]?.let { students ->
                val teachingGroups = groupingService.assignStudents(students, teaching)
                val currentSession = teaching.weeks.indexOf(currentWeek) + 1
                if (teaching.sessionsPerWeek == 0) //all the sessions in a week, the teaching groups for this week are the same students with the different session ids
                {
                    currentWeekTeachingGroups.addAll(teachingGroups.filter { it.groupId == currentSession })
                } else { //all the teaching groups with the same sessionId
                    currentWeekTeachingGroups.addAll(teachingGroups.filter { it.sessionId >= 1 + teaching.sessionsPerWeek * (currentSession - 1) && it.sessionId < 1 + teaching.sessionsPerWeek * (currentSession) })
                }
            }
        }

        //we remove the empty groups
        currentWeekTeachingGroups.removeIf { it.studentIds.isEmpty() }

        val teachingById =
            currentWeekTeachings
                .associateBy { it.id }

        val conflictGraph = ConflictGraphBuilder(teachingById).build(currentWeekTeachingGroups)

        val fixedAssignments = mutableMapOf<TeachingGroup, TimeSlot>()

        val possibleSlotsByGroup = mutableMapOf<TeachingGroup, MutableList<TimeSlot>>()
        currentWeekTeachingGroups.forEach { group ->
            teachingById[group.teachingId]?.let { teaching ->
                //we search for all the timeslots already fixed for this teachingId and this group. we use the same time slot but updated for the current week
                if (teaching.sessionsPerWeek > 0) {
                    allFixedEvents.filter { it.teachingId == teaching.id && it.groupId == group.groupId && (it.sessionId + teaching.sessionsPerWeek == group.sessionId || it.sessionId - teaching.sessionsPerWeek == group.sessionId) }
                        .forEach { fixedEvent ->
                            if (fixedEvent.week != null && fixedEvent.day != null && fixedEvent.startMinutes != null && fixedEvent.endMinutes != null) {
                                fixedAssignments[group] =
                                    TimeSlot(
                                        currentWeek,
                                        fixedEvent.day,
                                        fixedEvent.startMinutes,
                                        fixedEvent.endMinutes - fixedEvent.startMinutes
                                    )
                            }

                        }
                } else {
                    allFixedEvents.filter { it.teachingId == teaching.id && (it.groupId-1 == group.groupId || it.groupId+1 == group.groupId) && it.sessionId == group.sessionId }
                        .forEach { fixedEvent ->
                            if (fixedEvent.week != null && fixedEvent.day != null && fixedEvent.startMinutes != null && fixedEvent.endMinutes != null) {
                                fixedAssignments[group] =
                                    TimeSlot(
                                        currentWeek,
                                        fixedEvent.day,
                                        fixedEvent.startMinutes,
                                        fixedEvent.endMinutes - fixedEvent.startMinutes
                                    )
                            }

                        }
                }

                for (constraint in teaching.timeConstraints.filter { it.week == currentWeek }) {
                    TimeSlotFactory(currentWeek, constraint.day, constraint.startMinutes, constraint.endMinutes, 30).generate(teaching.durationMinutes).forEach { slot ->
                        possibleSlotsByGroup.getOrPut(group) { mutableListOf() }.add(slot)
                    }
                }
            }
        }

        val solver = Solver(teachingById)

        solution = solver.solve(
            conflictGraph,
            possibleSlotsByGroup,
            fixedAssignments
        )

        //we want the sessions ids for each group in a teaching to be ordered by increasing timeslot
        teachingById.forEach { (id, _) ->
            val _solutionForThisTeaching = solution.filter { it.key.teachingId == id }

            //we map group Ids to list of TeachingGroups sorted by increasing order of timeslot
            val groupIdsToTimeSortedTeachingGroups: Map<Int, List<TeachingGroup>> =
                _solutionForThisTeaching.entries
                    .groupBy { it.key.groupId }
                    .mapValues { (_, entries) ->
                        entries
                            .sortedWith(
                                compareBy<Map.Entry<TeachingGroup, TimeSlot?>> { it.value?.week }
                                    .thenBy { it.value?.day?.value }
                                    .thenBy { it.value?.startMinutes }
                            )
                            .map { it.key }
                    }

            //we renumber the session Id for each TeachingGroup according to its index in TimeSorted list of TeachingGroup
            groupIdsToTimeSortedTeachingGroups.forEach { (_, teachingGroups) ->
                val firstSessionIfForThisWeek = teachingGroups.map { it.sessionId }.min()
                teachingGroups.forEachIndexed { index, teachingGroup ->
                    teachingGroup.sessionId = firstSessionIfForThisWeek+index
                }
            }


        }

        //we add to the solution the former fixedEvents
        allFixedEvents.forEach { formerFixedEvent ->
            if (formerFixedEvent.week!=null && formerFixedEvent.day!=null && formerFixedEvent.startMinutes!=null)
                if (solution.keys.none { formerFixedEvent.teachingId == it.teachingId && formerFixedEvent.groupId == it.groupId && formerFixedEvent.sessionId == it.sessionId })
                    solution[TeachingGroup(formerFixedEvent.teachingId, formerFixedEvent.groupId, formerFixedEvent.sessionId,formerFixedEvent.studentIds)] = TimeSlot(formerFixedEvent.week, formerFixedEvent.day, formerFixedEvent.startMinutes!!, formerFixedEvent.endMinutes!! - formerFixedEvent.startMinutes!!)
        }
        return solution

    }

    private fun getInWeekTeachings(teachings:List<Map<String, Any>>, currentWeek: String):List<Teaching> {
        val inWeekTeachings = mutableListOf<Teaching>()
        inWeekTeachings.addAll(teachings.mapNotNull { tJson ->
                val startDate = tJson["startDate"] as String
                val sessions = (tJson["sessions"] as Int?) ?: 1
                val sessionsPerWeek  = (tJson["sessionsPerWeek"] as Int?) ?: 1
                val weeks  = tJson["weeks"] as List<String>

                val timeConstraints = (tJson["timeConstraints"] as List<Map<String, Any>>).map { constraintJson ->
                    TimeConstraint(
                        week = constraintJson["week"] as String,
                        day = constraintJson["day"].let { DayOfWeek.valueOf(it as String) },
                        startMinutes = constraintJson["startMinutes"] as Int,
                        endMinutes = constraintJson["endMinutes"] as Int
                    )
                }

                if (!weeks.contains(currentWeek)) return@mapNotNull null

                Teaching(
                    id = tJson["id"] as String,
                    unitId = (tJson["id"] as String).split("-")[0],
                    type = TeachingType.valueOf(tJson["type"] as String),
                    durationMinutes = tJson["durationMinutes"] as Int,
                    groupCapacity = tJson["groupCapacity"] as Int,
                    groupingKey = tJson["groupingKey"] as String?,
                    sessions = sessions,
                    sessionsPerWeek = sessionsPerWeek,
                    teacherCount = tJson["teacherCount"] as Int,
                    timeConstraints = timeConstraints,
                    startDate = startDate,
                    weeks = weeks
                )
            }
        )
        return inWeekTeachings
    }

    private fun parseFixedEvents(eventsJson: List<Map<String, Any>>): List<CalendarEvent> {
        return eventsJson.map { e ->
            CalendarEvent(
                teachingId = e["teachingId"] as String,
                groupId = (e["groupId"] as Number).toInt(),
                sessionId = (e["sessionId"]as Number).toInt(),
                day = (e["day"] as? String)?.let(DayOfWeek::valueOf),
                startMinutes = (e["startMinutes"] as? Number)?.toInt(),
                endMinutes = (e["endMinutes"] as? Number)?.toInt(),
                studentIds = ((e["studentIds"] as? List<String>) ?: emptyList()).toMutableSet(),
                week = e["week"] as String
            )
        }
    }

    private fun parseStudents(studentsJson:List<Map<String, Any>>):Map<String, MutableList<Student>> {
        val teachingUnitIdToStudents = mutableMapOf<String, MutableList<Student>>()
        studentsJson.forEach { json ->
            val s = Student(
                id = json["id"] as String,
                firstName = json["firstName"] as String,
                lastName = json["lastName"] as String,
                teachingUnitIds =
                    (json["teachingUnitIds"] as List<String>).toSet()
            )
            (json["teachingUnitIds"] as List<String>).forEach { tuid ->
                teachingUnitIdToStudents.getOrPut(tuid) { mutableListOf() }
                    .add(s)
            }
        }
        return teachingUnitIdToStudents
    }

    private fun parsePivotStrategy(settingsJson: Map<String, Any>): PivotStrategy?  =
        settingsJson["pivotStrategy"]?.let { return PivotStrategy.valueOf(it as String) }

}