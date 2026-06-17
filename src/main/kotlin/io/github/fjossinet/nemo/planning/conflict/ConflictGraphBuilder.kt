package io.github.fjossinet.nemo.planning.conflict

import io.github.fjossinet.nemo.model.teaching.Teaching
import io.github.fjossinet.nemo.model.teaching.TeachingGroup

class ConflictGraphBuilder(private val teachingById: Map<String, Teaching>) {

    fun build(groups: List<TeachingGroup>): ConflictGraph {
        val graph = ConflictGraph()

        groups.forEach { graph.addGroup(it) }

        addStudentConflicts(groups, graph)

        return graph
    }

    private fun addStudentConflicts(
        groups: List<TeachingGroup>,
        graph: ConflictGraph
    ) {

        val studentToGroups = mutableMapOf<String, MutableList<TeachingGroup>>()

        for (group in groups) {
            group.studentIds.forEach { studentId ->
                studentToGroups
                    .getOrPut(studentId) { mutableListOf() }
                    .add(group)
            }
        }

        for ((studentId, gs) in studentToGroups) {
            for (i in gs.indices) {
                for (j in i + 1 until gs.size) {
                    graph.addConflict(
                        gs[i],
                        gs[j],
                        ConflictCause.Student(studentId)
                    )
                }
            }
        }
    }




}