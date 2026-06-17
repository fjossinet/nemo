package io.github.fjossinet.nemo.model.teaching

import io.github.fjossinet.nemo.planning.time.TimeConstraint

//une activité d'enseignement  (un cours, un TD,.....) planifiable rattachée à une unité d'enseignement
data class Teaching(
    val id: String,
    val unitId: String,
    val type: TeachingType,
    val durationMinutes: Int,
    val groupCapacity: Int, //0 indique illimité
    val groupingKey: String? = null, // si existe, utilisé pour "marquer" les groupes afin que GroupingService puisse les retrouver et les réutiliser
    val startDate: String,
    val weeks:List<String>,
    val sessions: Int = 1,
    val sessionsPerWeek:Int = 1,
    val teacherCount: Int,
    val timeConstraints: List<TimeConstraint> = emptyList()
)
