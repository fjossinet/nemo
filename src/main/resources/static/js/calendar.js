const DAY_START = 8 * 60;
const DAY_END = 20 * 60;
const DAY_DURATION = DAY_END - DAY_START;

function initCalendar() {
    document.getElementById("get_planning").addEventListener("click", async (event) => {
        event.preventDefault();
        allFixedEvents = [] //we reset the fixedEvents to restart from scratch if this button is clicked
        await sendSolvePayload()
    });

    document.getElementById("prevWeekBtn")
        .addEventListener("click", () => {
            currentMondayInSemester.setDate(currentMondayInSemester.getDate() - 7);
            refreshCalendar();
        });

    document.getElementById("nextWeekBtn")
        .addEventListener("click", () => {
            currentMondayInSemester.setDate(currentMondayInSemester.getDate() + 7);
            refreshCalendar();
        });

    updateMondayLabel();

    renderHours();
}

async function sendSolvePayload() {
    const msgEl = document.getElementById("solveMessage");
    msgEl.textContent = "";

    const payload =  buildPayload();

    console.log("payload")
    console.log(payload)

    const response = await fetch("/solve", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const solution = await response.json();

    console.log("solution")
    console.log(solution)

    allFixedEvents = solution.allFixedEvents
    currentWeekEvents = []
    allFixedEvents.forEach(e => {
            if (e.week === getWeekStringFromMonday(firstMondayInSemester, currentMondayInSemester)) //an event will be displayed in the calendar is inWeek
                currentWeekEvents.push(e);
        }
    )
    console.log("current week events")
    console.log(currentWeekEvents)

    const unAssignedEvents = currentWeekEvents.filter(e => e.error !== null && e.day == null).length
    const assignedEventsWithErrors = currentWeekEvents.filter(e => e.error !== null && e.day !== null).length
    let message = [];

    if (unAssignedEvents > 0) {
        message.push(`${unAssignedEvents} groupes non affichés car sans créneau`);
    }

    if (assignedEventsWithErrors > 0) {
        message.push(`${assignedEventsWithErrors} groupes affichés en gris avec créneau mais en conflit`);
    }

    if (message.length > 0) {
        msgEl.textContent = message.join(", ");
        msgEl.style.color = "crimson";
    }
    else
        msgEl.textContent = "";
    renderGroupsTable()
    renderCalendar()
    fillStudentsGroups()
}

function updateMondayLabel() {
    const label = document.getElementById("currentMondayLabel");

    label.textContent =
        "Semaine " + getWeekStringFromMonday(firstMondayInSemester, currentMondayInSemester) + " ("+
        currentMondayInSemester.toLocaleDateString("fr-FR", {
            year: "numeric",
            month: "long",
            day: "numeric"
        })+")";
}

function refreshCalendar() {
    updateMondayLabel()
    sendSolvePayload();
}

/**
 * The calendar displayed the inWeekEvents
 */
function renderCalendar() {

    document.querySelectorAll(".day-column")
        .forEach(c => c.innerHTML = "");

    const eventsByDay = {};

    currentWeekEvents.forEach(e => {
        if (e.day !== null ) { //an event will be displayed in the calendar if has a day
            eventsByDay[e.day] ??= [];
            eventsByDay[e.day].push(e);
        }
    });

    Object.entries(eventsByDay).forEach(([day, dayEvents]) => {

        layoutDayEvents(dayEvents);

        const column =
            document.querySelector(`.day-column[data-day="${day}"]`);

        dayEvents.forEach(e => {

            const top =
                ((e.startMinutes - DAY_START) / DAY_DURATION) * 100;

            const height =
                ((e.endMinutes - e.startMinutes) / DAY_DURATION) * 100;

            const width = 100 / e._columnCount;
            const left = e._column * width;

            const div = document.createElement("div");
            div.className = "calendar-event";
            div.style.top = `${top}%`;
            div.style.height = `${height}%`;
            div.style.left = `${left}%`;
            div.style.width = `${width}%`;

            const parts = e.teachingId.split("-");
            const isCM = parts.length > 1 && parts[1].toUpperCase() === "CM";

            let hue = 0;
            if (e.error !== null) { //even with a day/hour, an event can have an error due to conflict to use this day/hour
                div.style.backgroundColor = `hsl(${hue}, 0%, 55%)`
            } else {
                hue = getHueForUnit(e.teachingId.split("-")[0]);
                if (isCM) {
                    div.style.backgroundColor = `hsl(${hue}, 65%, 85%)`
                } else {
                    div.style.backgroundColor = `hsl(${hue}, 65%, 85%)`
                }
            }

            if (e.error !== null) {
                div.style.borderStyle = "solid";
                div.style.borderWidth = "2px";
                div.style.borderColor = `hsl(0, 0%, 45%)`;
                div.style.color = `white`;
                div.style.fontWeight = "bold";
            } else if (isCM) {
                div.style.borderStyle = "solid";
                div.style.borderWidth = "2px";
                div.style.borderColor = `hsl(${hue}, 65%, 45%)`;
                div.style.color = `hsl(${hue}, 65%, 35%)`;
                div.style.fontWeight = "bold";
            } else {
                div.style.borderStyle = "solid";
                div.style.borderWidth = "2px";
                div.style.borderColor = `hsl(${hue}, 65%, 45%)`;
                div.style.color = `hsl(${hue}, 65%, 35%)`;
                div.style.fontWeight = "bold";
            }
            div.style.borderRadius = "6px";

            div.textContent = `${e.teachingId}${e.sessionId} G${e.groupId}`;

            div.addEventListener("click", () => {
                const groupId = `${e.teachingId}-${e.sessionId}-${e.groupId}`;
                const rows = document.querySelectorAll("#groupsTableBody tr");
                rows.forEach(row => {
                    row.classList.remove("highlight"); // Retirez la surbrillance de toutes les lignes
                    if (row.getAttribute("data-group-id") === groupId) {
                        row.classList.add("highlight"); // Ajoutez la surbrillance à la ligne correspondante
                    }
                });
            });

            column.appendChild(div);
        });
    });
}

function renderHours() {

    const column = document.getElementById("time-column");
    column.innerHTML = "";

    for (let minutes = DAY_START; minutes <= DAY_END; minutes += 60) {

        const top =
            ((minutes - DAY_START) / DAY_DURATION) * 100;

        const label = document.createElement("div");
        label.className = "hour-label";
        label.style.top = `${top}%`;

        const h = Math.floor(minutes / 60)
            .toString()
            .padStart(2, "0");

        label.textContent = `${h}:00`;

        column.appendChild(label);
    }
}

function renderGroupsTable() {
    const tbody = document.getElementById("groupsTableBody");
    tbody.innerHTML = "";

    currentWeekEvents.sort((a, b) => {
        const t = a.teachingId.localeCompare(b.teachingId);
        if (t !== 0) return t;

        if (a.day === null) return -1;
        if (b.day === null) return -1;
        return a.day.localeCompare(b.day);
    }).forEach(e => {
        const tr = document.createElement("tr");
        const hue = getHueForUnit(e.teachingId.split("-")[0]);
        tr.classList.add("group-row");
        tr.classList.add("group-row-" + (
            e.day == null ? "weekend" :
                e.day.toLowerCase()
        ))
        if (e.error !== null && e.day !==null) {
            tr.style.backgroundColor = `hsl(0, 0%, 55%)`
            tr.style.color = `white`;
        } else {
            tr.style.backgroundColor = `hsl(${hue}, 65%, 85%)`;
        }
        tr.setAttribute("data-group-id", `${e.teachingId}-${e.sessionId}-${e.groupId}`);
        tr.addEventListener("click", () => {

        });
        tr.innerHTML = `
            <td>${e.teachingId}</td>
            <td>${e.sessionId}</td>
            <td>${e.groupId}</td>
            <td>${e.day ?? ""}</td>
            <td>${e.startMinutes == null ? "" : minutesToTime(e.startMinutes)}</td>
            <td>${e.endMinutes == null ? "" : minutesToTime(e.endMinutes)}</td>
            <td>${e.studentIds.length}</td>
            <td>${e.error ?? ""}</td>
        `;
        tbody.appendChild(tr);
    });
}

function clusterEvents(events) {

    const clusters = [];

    events.forEach(event => {
        let placed = false;

        for (const cluster of clusters) {
            if (cluster.some(e => overlaps(e, event))) {
                cluster.push(event);
                placed = true;
                break;
            }
        }

        if (!placed) {
            clusters.push([event]);
        }
    });

    return clusters;
}

function overlaps(a, b) {
    return a.startMinutes < b.endMinutes &&
        b.startMinutes < a.endMinutes;
}

function assignColumns(cluster) {

    const columns = [];

    cluster.forEach(event => {
        let col = 0;

        while (columns[col]?.some(e => overlaps(e, event))) {
            col++;
        }

        if (!columns[col]) {
            columns[col] = [];
        }

        columns[col].push(event);
        event._column = col;
        event._columnCount = null; // sera rempli après
    });

    const columnCount = columns.length;
    cluster.forEach(e => e._columnCount = columnCount);
}

function layoutDayEvents(events) {

    const sorted = [...events].sort(
        (a, b) => a.startMinutes - b.startMinutes
    );

    const clusters = clusterEvents(sorted);

    clusters.forEach(cluster => assignColumns(cluster));
}