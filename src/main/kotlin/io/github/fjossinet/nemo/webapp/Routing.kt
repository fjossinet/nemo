package io.github.fjossinet.nemo.webapp

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import io.github.fjossinet.nemo.model.event.CalendarEvent
import io.ktor.http.ContentType
import io.ktor.server.application.*
import io.ktor.server.http.content.staticResources
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Application.configureRouting() {

    val solveService = SolveService()
    val mapper = jacksonObjectMapper()

    fun loadJsonFromString(json: String): Any {
        return mapper.readValue(json, Any::class.java)
    }

    routing {
        post("/bootstrap") {

            fun load(resource: String): Any = mapper.readValue(
                Thread.currentThread().contextClassLoader.getResourceAsStream(resource)
                    ?: error("Resource not found: $resource"), Any::class.java
            )

            val response = mapOf(
                "teachingUnits" to load("bootstrap/teaching_units.json"),
                "students" to load("bootstrap/students.json"),
                "settings" to load("bootstrap/settings.json")
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

        staticResources("/", "static") {
            default("index.html")
        }
    }
}