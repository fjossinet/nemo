package io.github.fjossinet.nemo.planning.conflict

sealed class ConflictCause {
    data class Student(val studentId: String) : ConflictCause()
    data class Teacher(val teacherId: String) : ConflictCause()
}