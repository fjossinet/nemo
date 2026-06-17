const DAY_START = 8 * 60;
const DAY_END = 18 * 60;
const DAY_DURATION = DAY_END - DAY_START;

let firstMondayInSemester; //a date object
let lastMondayInSemester; //a date object
let currentMondayInSemester; //a date object

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
}

document.getElementById("prevWeekBtn")
    .addEventListener("click", () => {
        currentMondayInSemester.setDate(currentMondayInSemester.getDate() - 7);
        refreshCalendar();
        sendSolvePayload();
    });

document.getElementById("nextWeekBtn")
    .addEventListener("click", () => {
        currentMondayInSemester.setDate(currentMondayInSemester.getDate() + 7);
        refreshCalendar();
        sendSolvePayload();
    });

/**
 * The calendar displayed the inWeekEvents
 */
function renderCalendar() {

    renderHours();

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