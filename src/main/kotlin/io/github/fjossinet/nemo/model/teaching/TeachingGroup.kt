package io.github.fjossinet.nemo.model.teaching

//un groupe d'etudiants rattaché à une activité d'enseignement (teachingId) et à une session (sessionId)
data class TeachingGroup(
    val teachingId: String,
    val groupId: Int,
    var sessionId: Int,
    val studentIds: MutableSet<String> = mutableSetOf(),
    var error: String? = null
)