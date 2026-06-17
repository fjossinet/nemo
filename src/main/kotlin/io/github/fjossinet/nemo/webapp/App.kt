package io.github.fjossinet.nemo.webapp

import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty

fun main() {
    embeddedServer(
        Netty,
        port = 8080,
        host = "0.0.0.0"
    ) {
        configureSerialization()
        configureRouting()
    }.start(wait = true)
}