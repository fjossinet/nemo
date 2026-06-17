package io.github.fjossinet.nemo.planning.solver

import io.github.fjossinet.nemo.model.teaching.Teaching
import io.github.fjossinet.nemo.model.teaching.TeachingGroup
import io.github.fjossinet.nemo.planning.conflict.*
import io.github.fjossinet.nemo.planning.time.*

class Solver(private val teachingById: Map<String, Teaching>) {

    fun solve(
        conflictGraph: ConflictGraph,
        possibleSlotsByGroup: Map<TeachingGroup, List<TimeSlot>>,
        fixedAssignments: MutableMap<TeachingGroup, TimeSlot> = mutableMapOf()
    ): MutableMap<TeachingGroup, TimeSlot?> {

        //verifions que les fixedAssignments ne sont déjà pas en conflit
        fixedAssignments.forEach { (group, slot) ->
            conflictGraph.conflictsOf(group).forEach { other ->
                fixedAssignments[other]?.let { otherSlot ->
                    if (overlaps(slot, otherSlot)) {
                        //si pas de contrainte de temps, ce groupe est dans les fixedAssignments dû à un placement trouvé par l'algo
                        group.error = if (teachingById[group.teachingId]?.timeConstraints != null) "Conflit étudiant : contrainte incompatible avec ${if (teachingById[other.teachingId]?.timeConstraints != null) "la contrainte" else "le placement"} de ${teachingById[other.teachingId]?.unitId} ${teachingById[other.teachingId]?.type}" else "Conflit étudiant : placement incompatible avec ${if (teachingById[other.teachingId]?.timeConstraints != null) "la contrainte" else "le placement"} de ${teachingById[other.teachingId]?.unitId} ${teachingById[other.teachingId]?.type}"
                        other.error = if (teachingById[other.teachingId]?.timeConstraints != null) "Conflit étudiant : contrainte incompatible avec ${if (teachingById[group.teachingId]?.timeConstraints != null) "la contrainte" else "le placement"} de ${teachingById[group.teachingId]?.unitId} ${teachingById[group.teachingId]?.type}" else "Conflit étudiant : placement incompatible avec ${if (teachingById[group.teachingId]?.timeConstraints != null) "la contrainte" else "le placement"} de ${teachingById[group.teachingId]?.unitId} ${teachingById[group.teachingId]?.type}"
                    }
                }
            }
        }

        val fixedByTeaching =
            fixedAssignments.entries.groupBy { it.key.teachingId }
        fixedByTeaching.forEach { (teachingId, entries) ->

            val teaching = teachingById[teachingId]
                ?: error("Unknown teaching $teachingId")

            val capacity = teaching.teacherCount

            // Pas de limite
            if (capacity <= 0) return@forEach

            // Comparer tous les slots entre eux
            for (i in entries.indices) {
                val (groupA, slotA) = entries[i]

                var simultaneous = 1

                for (j in entries.indices) {
                    if (i == j) continue

                    val (_, slotB) = entries[j]

                    if (overlaps(slotA, slotB)) {
                        simultaneous++
                    }
                }

                if (simultaneous > capacity) {
                    groupA.error =
                        //si pas de contrainte de temps, ce groupe est dans les fixedAssignments dû à un placement trouvé par l'algo
                        if (teachingById[groupA.teachingId]?.timeConstraints != null) "Contrainte incompatible avec le nombre d'enseignants disponibles ($capacity enseignants) : " +
                                "$simultaneous groupes se chevauchent dans le crénau $slotA " else "Placement incompatible avec le nombre d'enseignants disponibles ($capacity enseignants) : " +
                                "$simultaneous groupes se chevauchent dans le crénau $slotA "
                }
            }
        }

        val assignments = mutableMapOf<TeachingGroup, TimeSlot?>()
        assignments.putAll(fixedAssignments)

        //we solve first the groups with the largest conflicts and not already assigned then group Id then session Id
        val groups = conflictGraph.groups()
            .filterNot { it in fixedAssignments.keys.toList() }


        for (group in groups) {
            val possibleSlots =
                possibleSlotsByGroup[group]
            if (possibleSlots == null) {
                group.error = "Aucun créneau possible"
                assignments[group] = null
            }

            else {

                val chosenSlot = possibleSlots
                    .sortedWith(compareBy { it.startMinutes % 60 != 0 })
                    .firstOrNull { slot ->
                        isSlotAllowed(group, slot, assignments, conflictGraph) && respectsTeacherCapacity(
                            group,
                            slot,
                            assignments,
                            teachingById
                        )
                    }

                if (chosenSlot == null) {
                    if (group.error == null) {
                        group.error = "Aucun des créneaux possibles ne respecte les contraintes"
                    }
                }

                assignments[group] = chosenSlot
            }
        }

        return assignments
    }

    private fun isSlotAllowed(
        group: TeachingGroup,
        slot: TimeSlot,
        assignments: Map<TeachingGroup, TimeSlot?>,
        graph: ConflictGraph
    ): Boolean {
        //for all the conflicting groups, the proposed slot cannot overlap the slots already assigned (if any)
        val b = graph.conflictsOf(group).all { other ->
            val otherSlot = assignments[other]
            otherSlot == null || !overlaps(slot, otherSlot)
        }
        return b
    }

    private fun respectsTeacherCapacity(
        group: TeachingGroup,
        slot: TimeSlot,
        assignment: Map<TeachingGroup, TimeSlot?>,
        teachingById: Map<String, Teaching>
    ): Boolean {

        val teaching = teachingById[group.teachingId]!!
        val capacity = teaching.teacherCount

        val simultaneousGroups =
            assignment.count { (g, s) ->
                g.teachingId == group.teachingId && s != null &&
                        overlaps(s, slot)
            }

        return simultaneousGroups < capacity
    }


    private fun overlaps(a: TimeSlot, b: TimeSlot): Boolean =
        a.day == b.day &&
                a.startMinutes < b.endMinutes &&
                b.startMinutes < a.endMinutes


}