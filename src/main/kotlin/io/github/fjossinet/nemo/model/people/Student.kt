package io.github.fjossinet.nemo.model.people

data class Student(
    val id: String,
    val firstName: String,
    val lastName: String,
    val teachingUnitIds: Set<String>
)
