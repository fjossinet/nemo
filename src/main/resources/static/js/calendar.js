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
    updateSelectedTeachingsCount();
    renderTeachingsCurrentWeekTable();
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

    const currentWeek = getWeekStringFromMonday(firstMondayInSemester, currentMondayInSemester);

    teachingsCurrentWeek = teachings
        .filter(t => {
            getWeeksNeeded(t); // garantit que t.weeks est peuplé
            return (t.weeks || []).includes(currentWeek);
        })
        .sort((a, b) => a.id.localeCompare(b.id));
}

function refreshCalendar() {
    updateMondayLabel();
    renderTeachingsCurrentWeekTable();
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

function renderTeachingsCurrentWeekTable() {
    const tbody = document.getElementById("teachingsCurrentWeekTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    teachingsCurrentWeek.forEach((teaching, index) => {
        updateTeachingCurrentWeekRow(teaching, index, teachingsCurrentWeek.length);
    });

    bindTeachingCurrentWeekTableInputs();
}

function updateTeachingCurrentWeekRow(teaching, index, totalTeachings) {
    const tbody = document.getElementById("teachingsCurrentWeekTableBody");
    let row = document.querySelector(`#teachingsCurrentWeekTableBody tr[data-teaching-id="${teaching.id}"]`);

    const tr = document.createElement("tr");
    tr.dataset.teachingId = teaching.id;
    tr.dataset.index = index; // Add index to the row for reordering
    const hue = getHueForUnit(teaching.unitId);
    tr.style.backgroundColor = `hsl(${hue}, 65%, 85%)`;

    // checkbox for row selection
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = teaching.selected === true;
    checkbox.dataset.teachingId = teaching.id;
    checkbox.className = "teaching-checkbox";

    // cell for up/down arrows
    const upButton = document.createElement("button");
    upButton.style.backgroundColor = "transparent";
    upButton.style.border = "none";
    upButton.textContent = "↑";
    upButton.disabled = index === 0; // Disable up button for the first row
    upButton.style.color = index === 0 ? tr.style.backgroundColor : "black";
    upButton.className = "move-button";
    upButton.dataset.action = "up";
    upButton.dataset.teachingId = teaching.id;

    upButton.addEventListener("click", (e) => {
        e.stopPropagation();
        const index = parseInt(e.target.closest("tr").dataset.index);
        moveTeachingUp(index);
    });

    const downButton = document.createElement("button");
    downButton.style.backgroundColor = "transparent";
    downButton.style.border = "none";
    downButton.textContent = "↓";
    downButton.disabled = index === totalTeachings - 1; // Disable down button for the last row
    downButton.style.color = index === totalTeachings - 1 ? tr.style.backgroundColor : "black";
    downButton.className = "move-button";
    downButton.dataset.action = "down";
    downButton.dataset.teachingId = teaching.id;
    downButton.addEventListener("click", (e) => {
        e.stopPropagation();
        const index = parseInt(e.target.closest("tr").dataset.index);
        moveTeachingDown(index);
    });

    tr.innerHTML = `
            <td>${teaching.unitId}</td>
            <td>${teaching.type}</td>
        `;

    const tdCheckbox = document.createElement("td");
    tdCheckbox.appendChild(checkbox);

    const tdMove = document.createElement("td");
    tdMove.appendChild(upButton);
    tdMove.appendChild(document.createElement("br")); // Add a line break
    tdMove.appendChild(downButton);

    tr.insertBefore(tdCheckbox, tr.firstChild);
    tr.insertBefore(tdMove, tr.firstChild);

    if (row) {
        row.replaceWith(tr);
    } else {
        tbody.appendChild(tr);
    }
    bindTeachingCurrentWeekTableInputs()
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

function bindTeachingCurrentWeekTableInputs() {

    // Écouteur pour la case à cocher "Tout sélectionner"
    const selectAllCheckbox = document.getElementById("selectAllTeachings");
    selectAllCheckbox.checked = false;
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener("change", (e) => {
            const isChecked = e.target.checked;
            // Mettre à jour toutes les cases à cocher des lignes teaching
            document.querySelectorAll(".teaching-checkbox").forEach(checkbox => {
                checkbox.checked = isChecked;
                const teachingId = checkbox.dataset.teachingId;
                const teaching = teachings.find(t => t.id === teachingId);
                if (teaching) {
                    teaching.selected = isChecked;
                }
            });
            updateSelectedTeachingsCount();
        });
    }

    // Écouteurs pour les cases à cocher
    document.querySelectorAll(".teaching-checkbox").forEach(checkbox => {
        checkbox.addEventListener("change", (e) => {
            const teachingId = e.target.dataset.teachingId;
            const teaching = teachings.find(t => t.id === teachingId);
            if (teaching) {
                teaching.selected = e.target.checked;
            }
            updateSelectedTeachingsCount();
        });
    });

    document.querySelectorAll(".move-button").forEach(button => {
        button.addEventListener("click", (e) => {
            const teachingId = e.target.dataset.teachingId;
            const action = e.target.dataset.action;
            const index = parseInt(e.target.closest("tr").dataset.index);

            if (action === "up") {
                moveTeachingUp(index);
            } else if (action === "down") {
                moveTeachingDown(index);
            }
        });
    });

}


function moveTeachingUp(index) {
    if (index > 0) {
        [teachingsCurrentWeek[index], teachingsCurrentWeek[index - 1]] = [teachingsCurrentWeek[index - 1], teachingsCurrentWeek[index]];
        renderTeachingsCurrentWeekTable();
    }
}

function moveTeachingDown(index) {
    if (index < teachings.length - 1) {
        [teachingsCurrentWeek[index], teachingsCurrentWeek[index + 1]] = [teachingsCurrentWeek[index + 1], teachingsCurrentWeek[index]];
        renderTeachingsCurrentWeekTable();
    }
}

function updateSelectedTeachingsCount() {
    const count = teachings.filter(t => t.selected).length;
    const text = count + " enseignement(s) sélectionné(s)";
    document.querySelectorAll(".teachings-selection-count").forEach(el => {
        el.textContent = text;
    });
}