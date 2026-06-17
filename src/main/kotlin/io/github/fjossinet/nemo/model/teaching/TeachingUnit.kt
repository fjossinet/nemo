package io.github.fjossinet.nemo.model.teaching

//une UE
data class TeachingUnit(
    val id: String,
    val name: String,
    val teachings: List<Teaching>
)

