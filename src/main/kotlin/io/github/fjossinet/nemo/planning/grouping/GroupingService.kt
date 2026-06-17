package io.github.fjossinet.nemo.planning.grouping

import io.github.fjossinet.nemo.model.people.Student
import io.github.fjossinet.nemo.model.teaching.Teaching
import io.github.fjossinet.nemo.model.teaching.TeachingGroup
import kotlin.random.Random

class GroupingService(private val pivotStrategy: PivotStrategy = PivotStrategy.MOST_CONSTRAINED) {

    /**
     * Stockage des groupes déjà trouvés et associés à un groupingKey
     */
    private val groupingCache =
        mutableMapOf<String, List<TeachingGroup>>()

    fun assignStudents(
        students: List<Student>,
        teaching: Teaching
    ): List<TeachingGroup> {

        val key = teaching.groupingKey

        // 1️⃣ Cas groupingKey : on réutilise des groupes existants
        if (key != null && groupingCache.containsKey(key)) {

            val referenceGroups = groupingCache[key]!!

            return cloneGroupsForTeaching(
                referenceGroups,
                teaching.id
            )
        }

        // 2️⃣ Création de nouveaux groupes par proximité de profil UE
        val remaining = students.toMutableList()

        val capacity = teaching.groupCapacity ?: 0   // 0 = illimité

        // calcul dynamique du nombre de groupes
        val groupCount =
            if (capacity == 0) 1
            else kotlin.math.ceil(
                students.size.toDouble() / capacity.toDouble()
            ).toInt()

        val rawGroups: List<MutableList<Student>> =
            List(groupCount) { mutableListOf() }

        var groupIndex = 0

        while (remaining.isNotEmpty()) {

            val pivot = selectPivot(remaining)
            val group = rawGroups[groupIndex]

            group.add(pivot)

            val pivotUEs = pivot.teachingUnitIds

            // étudiants triés par proximité avec le pivot
            val sortedBySimilarity =
                remaining.sortedByDescending { other ->
                    similarity(
                        pivotUEs,
                        other.teachingUnitIds
                    )
                }

            //capacité effective
            val effectiveCapacity =
                if (capacity == 0) Int.MAX_VALUE else capacity

            val spaceLeft = effectiveCapacity - group.size
            if (spaceLeft > 0) {
                val selected = sortedBySimilarity.take(spaceLeft)
                selected.forEach {
                    group.add(it)
                    remaining.remove(it)
                }
            }

            groupIndex = (groupIndex + 1) % rawGroups.size
        }

        // 3️⃣ Transformation des groupes d'étudiants en TeachingGroup attachés à une session Id et un group Id
        val groups = mutableListOf<TeachingGroup>()
            rawGroups.forEachIndexed { idx, groupStudents ->
            (1..teaching.sessions).forEach { sessionId ->
                groups.add(
                    TeachingGroup(
                        teachingId = teaching.id,
                        groupId = idx + 1,
                        studentIds = groupStudents.map { it.id }.toMutableSet(),
                        sessionId = sessionId
                    )
                )
            }
        }

        // 4️⃣ Mémorisation si groupingKey présent
        if (key != null)
            groupingCache[key] = groups

        return groups
    }

    private fun selectPivot(
        remaining: MutableList<Student>
    ): Student {

        return when (this.pivotStrategy) {
            PivotStrategy.FIRST ->
                remaining.removeFirst()

            PivotStrategy.RANDOM -> {
                val index = Random.nextInt(remaining.size)
                remaining.removeAt(index)
            }

            PivotStrategy.MOST_CONSTRAINED -> {
                val pivot = remaining.maxByOrNull { it.teachingUnitIds.size }!!
                remaining.remove(pivot)
                pivot
            }
        }
    }

    /**
     * Clonage de groupes existants pour un autre teaching
     * (mêmes étudiants, nouvel identifiant de teaching)
     */
    private fun cloneGroupsForTeaching(
        sourceGroups: List<TeachingGroup>,
        newTeachingId: String
    ): List<TeachingGroup> {

        return sourceGroups.map {
            TeachingGroup(
                teachingId = newTeachingId,
                groupId = it.groupId,
                sessionId = it.sessionId,
                studentIds = it.studentIds.toMutableSet()
            )
        }
    }

    private fun similarity(a: Set<String>, b: Set<String>): Int {
        return a.intersect(b).size
    }
}