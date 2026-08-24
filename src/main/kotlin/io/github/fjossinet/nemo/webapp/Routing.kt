package io.github.fjossinet.nemo.webapp

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import io.github.fjossinet.nemo.model.event.CalendarEvent
import io.ktor.http.ContentType
import io.ktor.server.application.*
import io.ktor.server.http.content.staticResources
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.io.File

fun Application.configureRouting() {

    val solveService = SolveService()
    val mapper = jacksonObjectMapper()

    fun loadJsonFromString(json: String): Any {
        return mapper.readValue(json, Any::class.java)
    }

    routing {
        post("/bootstrap") {

            fun loadFromFile(path: String): Any? {
                val file = File(path)
                return if (file.exists()) {
                    mapper.readValue(file, Any::class.java)
                } else {
                    null
                }
            }

            fun loadFromResources(resource: String): Any = mapper.readValue(
                Thread.currentThread().contextClassLoader.getResourceAsStream(resource)
                    ?: error("Resource not found: $resource"), Any::class.java
            )

            val teachingUnits = loadFromFile("save/teaching_units.json") ?: loadFromResources("bootstrap/teaching_units.json")
            val students = loadFromFile("save/students.json") ?: loadFromResources("bootstrap/students.json")
            val settings = loadFromFile("save/settings.json") ?: loadFromResources("bootstrap/settings.json")

            val response = mapOf(
                "teachingUnits" to teachingUnits,
                "students" to students,
                "settings" to settings
            )

            call.respondText(
                mapper.writeValueAsString(response),
                contentType = ContentType.Application.Json
            )

        }

        post("/solve") {
            val rawJson = call.receiveText()
            val data = loadJsonFromString(rawJson) as Map<String, Any>
            val currentWeek = (data["settings"] as Map<String, Any>)["currentWeek"] as String
            val solution = solveService.solveFromJson(data, currentWeek)
            val events: List<CalendarEvent> = solution.entries.map { (group, slot) ->
                slot?.let {
                    CalendarEvent(
                        teachingId = group.teachingId,
                        groupId = group.groupId,
                        sessionId = group.sessionId,
                        day = slot.day,
                        startMinutes = slot.startMinutes,
                        endMinutes = slot.startMinutes + slot.durationMinutes,
                        studentIds = group.studentIds,
                        error = group.error,
                        week = slot.week
                    )
                } ?: run {
                    CalendarEvent(
                        teachingId = group.teachingId,
                        groupId = group.groupId,
                        sessionId = group.sessionId,
                        day = null,
                        startMinutes = null,
                        endMinutes = null,
                        studentIds = group.studentIds,
                        error = group.error,
                        week = currentWeek
                    )
                }

            }

            call.respondText(
                mapper.writeValueAsString(mapOf("allFixedEvents" to events)),
                contentType = ContentType.Application.Json
            )
        }

        post("/save") {
            try {
                val rawJson = call.receiveText()
                val data = loadJsonFromString(rawJson) as Map<String, Any>

                // Log the save operation
                application.log.info("Saving Payload: $data")

                try {
                    val saveDir = File("save")
                    if (!saveDir.exists()) {
                        saveDir.mkdirs()
                    }

                    File("save/settings.json").writeText(
                        mapper.writerWithDefaultPrettyPrinter().writeValueAsString(data["settings"])
                    )

                    // Save teaching units
                    File("save/teaching_units.json").writeText(
                        mapper.writerWithDefaultPrettyPrinter().writeValueAsString(data["teachingUnits"])
                    )

                    // Save students
                    File("save/students.json").writeText(
                        mapper.writerWithDefaultPrettyPrinter().writeValueAsString(data["students"])
                    )

                    application.log.info("Payload saved to save directory")
                } catch (e: Exception) {
                    application.log.error("Could not save Payload to files: ${e.message}")
                    // This is not a critical error - the data is still logged
                }

                call.respondText(
                    "{\"status\": \"success\", \"message\": \"Données sauvegardées avec succès\"}",
                    contentType = ContentType.Application.Json
                )
            } catch (e: Exception) {
                application.log.error("Save error: ${e.message}", e)
                call.respondText(
                    "{\"status\": \"error\", \"message\": \"${e.message?.replace("\"", "\\\"")}\"}",
                    contentType = ContentType.Application.Json
                )
            }
        }

        staticResources("/", "static") {
            default("index.html")
        }
    }
}