package io.github.fjossinet.nemo.planning.conflict

import io.github.fjossinet.nemo.model.teaching.TeachingGroup

class ConflictGraph {

    private val graph: MutableMap<TeachingGroup, MutableSet<TeachingGroup>> = mutableMapOf()

    // causes des conflits
    private val conflictCauses:
            MutableMap<Pair<TeachingGroup, TeachingGroup>, MutableSet<ConflictCause>> = mutableMapOf()

    fun addGroup(group: TeachingGroup) {
        graph.putIfAbsent(group, mutableSetOf())
    }

    fun addConflict(
        a: TeachingGroup,
        b: TeachingGroup,
        cause: ConflictCause
    ) {
        if (a == b) return

        graph.getOrPut(a) { mutableSetOf() }.add(b)
        graph.getOrPut(b) { mutableSetOf() }.add(a)

        conflictCauses
            .getOrPut(orderedPair(a, b)) { mutableSetOf() }
            .add(cause)
    }

    fun conflictsOf(group: TeachingGroup): Set<TeachingGroup> =
        graph[group] ?: emptySet()

    fun causesBetween(
        a: TeachingGroup,
        b: TeachingGroup
    ): Set<ConflictCause> =
        conflictCauses[orderedPair(a, b)] ?: emptySet()

    fun groups(): Set<TeachingGroup> = graph.keys

    private fun orderedPair(
        a: TeachingGroup,
        b: TeachingGroup
    ): Pair<TeachingGroup, TeachingGroup> =
        if (a.hashCode() <= b.hashCode()) a to b else b to a

}