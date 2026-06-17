function bindTeachingTableInputs() {

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
        });
    });

    document.querySelectorAll(".duration-input")
        .forEach(input => {

            input.addEventListener("change", e => {

                const teachingId =
                    e.target.dataset.teachingId;

                const newDuration =
                    Number(e.target.value);

                const teaching =
                    teachings.find(t => t.id === teachingId);

                if (!teaching || newDuration <= 0) {
                    e.target.value = teaching?.durationMinutes ?? "";
                    return;
                }

                teaching.durationMinutes = newDuration;
                updateTeachingRow(teaching);
                generateTimeConstraintsTable(teaching);
            });
        });

    document.querySelectorAll(".teacher-count-input")
        .forEach(input => {

            input.addEventListener("change", e => {

                const teachingId =
                    e.target.dataset.teachingId;

                const newCount =
                    Number(e.target.value);

                const teaching =
                    teachings.find(t => t.id === teachingId);

                if (!teaching || !Number.isInteger(newCount) || newCount <= 0) {
                    e.target.value = teaching?.teacherCount ?? "";
                    return;
                }

                teaching.teacherCount = newCount;
                updateTeachingRow(teaching);
                generateTimeConstraintsTable(teaching);
            });
        });

    document.querySelectorAll(".capacity-input")
        .forEach(input => {

            input.addEventListener("change", e => {

                const teachingId = e.target.dataset.teachingId;
                let value = Number(e.target.value);

                const teaching =
                    teachings.find(t => t.id === teachingId);

                if (!teaching || !Number.isInteger(value) || value < 0) {
                    e.target.value = teaching?.groupCapacity ?? 0;
                    return;
                }

                teaching.groupCapacity = value;
                updateTeachingRow(teaching);
                generateTimeConstraintsTable(teaching);
            });
        });

    document.querySelectorAll(".session-count-input")
        .forEach(input => {

            input.addEventListener("change", e => {

                const teachingId = e.target.dataset.teachingId;
                let value = Number(e.target.value);

                const teaching =
                    teachings.find(t => t.id === teachingId);

                if (!teaching || !Number.isInteger(value) || value < 0) {
                    e.target.value = teaching?.sessions ?? 0;
                    return;
                }

                teaching.sessions = value;
                updateTeachingRow(teaching);
                generateTimeConstraintsTable(teaching);
            });
        });

    document.querySelectorAll(".session-per-week-input")
        .forEach(input => {

            input.addEventListener("change", e => {

                const teachingId = e.target.dataset.teachingId;
                let value = Number(e.target.value);

                const teaching =
                    teachings.find(t => t.id === teachingId);

                if (!teaching || !Number.isInteger(value) || value < 0) {
                    e.target.value = teaching?.sessions ?? 0;
                    return;
                }

                teaching.sessionsPerWeek = value;
                updateTeachingRow(teaching);
                generateTimeConstraintsTable(teaching);
            });
        });

    //bindMoveButtons(); // Bind event listeners for move buttons
}

function bindMoveButtons() {
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
        [teachings[index], teachings[index - 1]] = [teachings[index - 1], teachings[index]];
        renderTeachingTable();
    }
}

function moveTeachingDown(index) {
    if (index < teachings.length - 1) {
        [teachings[index], teachings[index + 1]] = [teachings[index + 1], teachings[index]];
        renderTeachingTable();
    }
}

function renderTeachingTable() {
    const tbody = document.getElementById("teachingTableBody");
    tbody.innerHTML = "";

    teachings
        .forEach((teaching, index) => {
            updateTeachingRow(teaching, index, teachings.length);
        });
    bindTeachingTableInputs();
}

function updateTeachingRow(teaching, index, totalTeachings) {
    const tbody = document.getElementById("teachingTableBody");
    let row = document.querySelector(`#teachingTableBody tr[data-teaching-id="${teaching.id}"]`);

    const hue = getHueForUnit(teaching.unitId);
    const studentCount = getStudentCountForTeaching(teaching.id.split("-")[0]);
    const weeksNeededInfo = getWeeksNeeded(teaching);

    const tr = document.createElement("tr");
    tr.dataset.teachingId = teaching.id;
    tr.dataset.index = index; // Add index to the row for reordering
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

    tr.innerHTML += `
        <td>${teaching.unitId}</td>
        <td>${teaching.type}</td>
        <td><input type="text"
            class="numeric-input capacity-input"
           data-teaching-id="${teaching.id}"
           value="${teaching.groupCapacity}"
           title="0 = illimité"
           style="width: 5em;"></td>
        <td><input type="text"
            class="numeric-input teacher-count-input"
           value="${teaching.teacherCount}"
           data-teaching-id="${teaching.id}"></td>
        <td>${teaching.weeks[0]}</td>
        <td>${teaching.weeks[weeksNeededInfo[0]-1-weeksNeededInfo[1]] + " (" + weeksNeededInfo[1] + " interruptions)"}</td>
        <td><input type="text"
            class="numeric-input session-count-input"
           value="${teaching.sessions}"
           data-teaching-id="${teaching.id}"></td>
        <td><input type="text"
            class="numeric-input session-per-week-input"
           value="${teaching.sessionsPerWeek}"
           data-teaching-id="${teaching.id}"></td>
        <td><input type="text"
                class="numeric-input duration-input"
                value="${teaching.durationMinutes}"
                data-teaching-id="${teaching.id}"></td>
        <td>${studentCount}</td>
        <td>${teaching.groupCapacity === 0 ? 1 : Math.ceil(studentCount / teaching.groupCapacity)}</td>
    `;

    const tdCheckbox = document.createElement("td");
    tdCheckbox.appendChild(checkbox);

    const tdMove = document.createElement("td");
    tdMove.appendChild(upButton);
    tdMove.appendChild(document.createElement("br")); // Add a line break
    tdMove.appendChild(downButton);

    tr.insertBefore(tdCheckbox, tr.firstChild);
    tr.insertBefore(tdMove, tr.firstChild);

    tr.addEventListener("click", () => {
        if (event.target.tagName === "INPUT") {
            return;
        }
        const detailsElement = document.querySelector('details.collapsible#timeConstraints');

        if (detailsElement && !detailsElement.open) {
            detailsElement.open = true;
        }

        generateTimeConstraintsTable(teaching);
    });

    if (row) {
        row.replaceWith(tr);
    } else {
        tbody.appendChild(tr);
    }
    bindTeachingTableInputs();
}

function generateTimeConstraintsTable(teaching) {
    const startDate = new Date(teaching.startDate);

    // Calculer le nombre de semaines nécessaires
    const weeksNeeded = getWeeksNeeded(teaching)[0];

    // Liste des jours en anglais pour la comparaison
    const daysOfWeek = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

    // Générer les en-têtes des colonnes (semaines)
    const thead = document.querySelector("#timeConstraintsTable thead");
    thead.innerHTML = "";

    // Ligne 1 : En-têtes des semaines
    const headerRow1 = document.createElement("tr");
    const th = document.createElement("th");
    th.innerHTML = teaching.id;
    headerRow1.appendChild(th);

    for (let week = 0; week < weeksNeeded; week++) {
        const weekDate = new Date(startDate);
        weekDate.setDate(startDate.getDate() + week * 7);
        const thWeek = document.createElement("th");
        thWeek.colSpan = 5; // 5 jours par semaine
        thWeek.textContent = `${getWeekStringFromMonday(firstMondayInSemester, weekDate)} (${weekDate.toLocaleDateString()})`;
        thWeek.dataset.week = getWeekStringFromMonday(firstMondayInSemester, weekDate);
        thWeek.style.cursor = "pointer";
        thWeek.addEventListener("click", () => {
            toggleWeek(getWeekStringFromMonday(firstMondayInSemester, weekDate));
            updateTimeConstraints(teaching);
        });
        headerRow1.appendChild(thWeek);
    }
    thead.appendChild(headerRow1);

    // Ligne 2 : En-têtes des jours
    const headerRow2 = document.createElement("tr");
    headerRow2.appendChild(document.createElement("th")); // Case vide pour l'en-tête des lignes

    for (let week = 0; week < weeksNeeded; week++) {
        for (let day = 0; day < 5; day++) {
            const dayDate = new Date(startDate);
            dayDate.setDate(startDate.getDate() + week * 7 + day);
            const thDay = document.createElement("th");
            thDay.textContent = dayDate.toLocaleDateString("fr-FR", { weekday: "short" });
            thDay.style.cursor = "pointer";
            thDay.addEventListener("click", () => {
                toggleDay(getWeekStringFromMonday(firstMondayInSemester, getMonday(dayDate)), daysOfWeek[day]);
                updateTimeConstraints(teaching);
            });
            headerRow2.appendChild(thDay);
        }
    }
    thead.appendChild(headerRow2);

    // Générer les lignes pour les créneaux horaires (8h00 à 18h00, par tranches de 30 minutes)
    const tbody = document.querySelector("#timeConstraintsTable tbody");
    tbody.innerHTML = "";

    for (let hour = 8; hour < 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const timeSlot = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}-${(minute+30 === 60 ? hour+1 : hour).toString().padStart(2, "0")}:${(minute+30 === 60 ? 0 : minute+30).toString().padStart(2, "0")}`;
            const timeInMinutes = hour * 60 + minute;
            const tr = document.createElement("tr");

            const thTime = document.createElement("th");
            thTime.textContent = timeSlot;
            thTime.style.cursor = "pointer";
            thTime.addEventListener("click", () => {
                toggleHour(timeSlot);
                updateTimeConstraints(teaching);
            });
            tr.appendChild(thTime);

            // Générer les cases pour chaque jour de chaque semaine
            for (let week = 0; week < weeksNeeded; week++) {
                const weekDate = new Date(startDate);
                weekDate.setDate(startDate.getDate() + week * 7);
                for (let day = 0; day < 5; day++) {
                    const td = document.createElement("td");
                    td.dataset.week = getWeekStringFromMonday(firstMondayInSemester, weekDate)
                    td.dataset.day = daysOfWeek[day];
                    td.dataset.time = timeSlot;

                    const weekName = getWeekStringFromMonday(firstMondayInSemester, weekDate);
                    const dayName = daysOfWeek[day];

                    //if no constraints found for this week
                    if (!(teaching.timeConstraints || []).some(constraint => {if (constraint.week === weekName) return true})) {
                        td.classList.remove("selected");
                    } else {
                        if (!(teaching.timeConstraints || []).some(constraint => {if (constraint.day === dayName) return true})) {
                            td.classList.remove("selected");
                        } else {
                            if ((teaching.timeConstraints || []).some(constraint => {
                                if (constraint.week === weekName && constraint.day === dayName && constraint.startMinutes !== undefined && constraint.endMinutes !== undefined) {
                                    return constraint.startMinutes <= timeInMinutes && constraint.endMinutes > timeInMinutes;
                                }
                            }))
                                td.classList.add("selected");
                        }
                    }

                    td.addEventListener("click", () => {
                        td.classList.toggle("selected");
                        updateTimeConstraints(teaching);
                    });
                    tr.appendChild(td);
                }
            }
            tbody.appendChild(tr);
        }
    }
}

/**
 * active/désactive une semaine dans le tableau de contraintes
 * @param week
 */
function toggleWeek(week) {
    const tds = document.querySelectorAll(`#timeConstraintsTable tbody td[data-week="${week}"]`);
    const allSelected = Array.from(tds).every(td => td.classList.contains("selected"));

    tds.forEach(td => {
        if (allSelected) {
            td.classList.remove("selected");
        } else {
            td.classList.add("selected");
        }
    });
}

/**
 * active/désactive une journée dans le tableau de contraintes
 * @param week
 */
function toggleDay(week, day) {
    const tds = document.querySelectorAll(`#timeConstraintsTable tbody td[data-week="${week}"][data-day="${day}"]`);
    const allSelected = Array.from(tds).every(td => td.classList.contains("selected"));

    tds.forEach(td => {
        if (allSelected) {
            td.classList.remove("selected");
        } else {
            td.classList.add("selected");
        }
    });
}

function toggleHour(timeSlot) {
    const tds = document.querySelectorAll(`#timeConstraintsTable tbody td[data-time="${timeSlot}"]`);
    const allSelected = Array.from(tds).every(td => td.classList.contains("selected"));

    tds.forEach(td => {
        if (allSelected) {
            td.classList.remove("selected");
        } else {
            td.classList.add("selected");
        }
    });
}

function updateTimeConstraints(teaching) {
    const weeksNeededBefore = getWeeksNeeded(teaching)[0]
    const tds = document.querySelectorAll("#timeConstraintsTable tbody td.selected");
    const newTimeConstraints = {};

    const weeksDisplayed =  Array.from(document.querySelectorAll("#timeConstraintsTable thead th"))
        .map(th => th.dataset.week)
        .filter(Boolean);

    Array.from(tds).map(td => {
        const week = td.dataset.week;
        const day = td.dataset.day;
        const time = td.dataset.time; //for exemple 8:00-8:30
        const dayDict = newTimeConstraints[week] || (newTimeConstraints[week] = {});
        const hours = dayDict[day] || (dayDict[day] = []);
        let [hour, minutes] = time.split("-")[0].split(":").map(Number)
        const startMinutes = hour * 60 + minutes;
        [hour, minutes] = time.split("-")[1].split(":").map(Number)
        const endMinutes = hour * 60 + minutes;
        hours.push([startMinutes, endMinutes]);
    });

    //we remove all the constraints related to the weeks displayed in the constraints table (weeksToUpdate)
    teaching.timeConstraints = (teaching.timeConstraints || []).filter(
        constraint => !weeksDisplayed.includes(constraint.week)
    );

    for (const week in newTimeConstraints) {
        const days = newTimeConstraints[week];
        for (const day in days) {
            days[day] = mergeContiguousMinutesRanges(days[day]);
            days[day].forEach(minutesRange => {
                teaching.timeConstraints.push(
                    {
                        week,
                        day,
                        startMinutes: minutesRange[0],
                        endMinutes: minutesRange[1]
                    }
                )
            })
        }
    }

    const weeksNeededAfter = getWeeksNeeded(teaching)[0]

    //some weeks need to be removed or added in the constraints table
    if (weeksNeededBefore !== weeksNeededAfter) {
        generateTimeConstraintsTable(teaching);
        //this has also an impact on the informations displayed in the teaching row
        updateTeachingRow(teaching)
    }

}

function generateStudentsTableHeaders(teachingUnits) {
    const thead = document.querySelector("#studentsTableContainer thead");
    thead.innerHTML = "";
    // Ligne 1 : En-têtes fixes et titres des UEs
    const headerRow1 = document.createElement("tr");

    const thId = document.createElement("th");
    thId.textContent = "ID";
    thId.style.position = "sticky";
    thId.style.left = "0";
    thId.style.background = "white";
    thId.style.zIndex = "1";
    headerRow1.appendChild(thId);

    const thFirstName = document.createElement("th");
    thFirstName.textContent = "Prénom";
    thFirstName.style.position = "sticky";
    thFirstName.style.left = "75px";
    thFirstName.style.background = "white";
    thFirstName.style.zIndex = "1";
    headerRow1.appendChild(thFirstName);

    const thLastName = document.createElement("th");
    thLastName.textContent = "Nom";
    thLastName.style.position = "sticky";
    thLastName.style.left = "150px";
    thLastName.style.background = "white";
    thLastName.style.zIndex = "1";
    headerRow1.appendChild(thLastName);

    // Ajouter les colonnes pour chaque UE
    teachingUnits.forEach(ue => {
        const thUE = document.createElement("th");
        thUE.id = ue.id;
        thUE.colSpan = 5;
        thUE.style.textAlign = "center";
        const hue = getHueForUnit(ue.id);
        thUE.style.backgroundColor = `hsl(${hue}, 65%, 85%)`;
        thUE.style.borderStyle = "solid";
        thUE.style.borderWidth = "2px";
        thUE.style.borderColor = `hsl(${hue}, 65%, 45%)`;

        // Bouton gauche
        const leftButton = document.createElement("button");
        leftButton.innerHTML = "&larr;";
        leftButton.style.color = `hsl(${hue}, 65%, 35%)`;
        leftButton.onclick = () => moveUEColumn(getUEHeaderIndex(ue.id), getUEHeaderIndex(ue.id) -1);

        // Texte de l'UE
        const ueText = document.createElement("span");
        ueText.textContent = ue.id;
        ueText.style.color = `hsl(${hue}, 65%, 35%)`;
        ueText.style.fontWeight = "bold";

        // Bouton droit
        const rightButton = document.createElement("button");
        rightButton.innerHTML = "&rarr;";
        rightButton.style.color = `hsl(${hue}, 65%, 35%)`;
        rightButton.onclick = () => moveUEColumn(getUEHeaderIndex(ue.id), getUEHeaderIndex(ue.id) + 1);

        thUE.appendChild(leftButton);
        thUE.appendChild(ueText);
        thUE.appendChild(rightButton);

        headerRow1.appendChild(thUE);
    });

    thead.appendChild(headerRow1);

    // Ligne 2 : Sous-en-têtes pour les types d'enseignement
    const headerRow2 = document.createElement("tr");

    const thIdEmpty = document.createElement("th");
    thIdEmpty.style.position = "sticky";
    thIdEmpty.style.left = "0";
    thIdEmpty.style.background = "white";
    thIdEmpty.style.zIndex = "1";
    headerRow2.appendChild(thIdEmpty);

    const thFirstNameEmpty = document.createElement("th");
    thFirstNameEmpty.style.position = "sticky";
    thFirstNameEmpty.style.left = "75px";
    thFirstNameEmpty.style.background = "white";
    thFirstNameEmpty.style.zIndex = "1";
    headerRow2.appendChild(thFirstNameEmpty);

    const thLastNameEmpty = document.createElement("th");
    thLastNameEmpty.style.position = "sticky";
    thLastNameEmpty.style.left = "150px";
    thLastNameEmpty.style.background = "white";
    thLastNameEmpty.style.zIndex = "1";
    headerRow2.appendChild(thLastNameEmpty);

    // Ajouter les sous-colonnes pour chaque type d'enseignement
    teachingUnits.forEach(ue => {
        ["Inscrit", "CM", "CI", "TD", "TP"].forEach(type => {
            const thType = document.createElement("th");
            thType.textContent = type;
            thType.style.cursor = "pointer";
            thType.onclick = () => sortStudentsTableByType(ue.id, type);
            headerRow2.appendChild(thType);
        });
    });

    thead.appendChild(headerRow2);
}

function sortStudentsTableByType(ueId, type) {

    const ueIndex = getUEHeaderIndex(ueId)
    const typeIndex = ["Inscrit", "CM", "CI", "TD", "TP"].indexOf(type);

    const tbody = document.getElementById("studentsTableBody");
    const rows = Array.from(tbody.querySelectorAll("tr"));

    rows.sort((rowA, rowB) => {
        const cellA = rowA.querySelector(`td:nth-child(${5 * (ueIndex-3) + 4 + typeIndex})`);
        const cellB = rowB.querySelector(`td:nth-child(${5 * (ueIndex-3) + 4 + typeIndex})`);
        const valueA = cellA.textContent;
        const valueB = cellB.textContent;

        // Logique de tri
        if (type === "Inscrit") {
            // Tri par "X" ou vide
            if (valueA === "X" && valueB !== "X") return -1;
            if (valueA !== "X" && valueB === "X") return 1;
            return 0;
        } else {
            // Tri par numéro de groupe
            if (valueA === "" && valueB !== "") return 1;
            if (valueA !== "" && valueB === "") return -1;
            return valueA.localeCompare(valueB);
        }
    });

    // Réorganiser les lignes
    rows.forEach(row => tbody.appendChild(row));
}

function getUEHeaderIndex(ueId) {
    const headers = Array.from(document.querySelectorAll("#studentsTableContainer thead tr:nth-child(1) th"));
    return headers.findIndex(header => header.id === ueId);
}

function moveUEColumn(fromUEIndex, toUEIndex) {
    // Récupérer les en-têtes des UEs (en ignorant les 3 premières colonnes fixes)
    const ueHeaders = Array.from(document.querySelectorAll("#studentsTableContainer thead tr:nth-child(1) th:not(:nth-child(-n))"));
    const teachingUnits = ueHeaders.map(th => th.id.replace("ue-header-", ""));

    // Vérifier que les indices sont valides
    if (fromUEIndex < 3 || fromUEIndex >= teachingUnits.length || toUEIndex < 3 || toUEIndex >= teachingUnits.length || fromUEIndex === toUEIndex) {
        return;
    }

    const thead = document.querySelector("#studentsTableContainer thead");
    const headerRow1 = thead.querySelector("tr:nth-child(1)");
    const headerRow2 = thead.querySelector("tr:nth-child(2)");
    const tbody = document.getElementById("studentsTableBody");

    // Déplacer le <th> principal de l'UE dans headerRow1
    const ueHeader = ueHeaders[fromUEIndex];
    if (toUEIndex > fromUEIndex) {
        headerRow1.insertBefore(ueHeader, ueHeaders[toUEIndex].nextSibling);
    } else {
        headerRow1.insertBefore(ueHeader, ueHeaders[toUEIndex]);
    }

    // Déplacer les sous-colonnes dans headerRow2
    const subHeaders = Array.from(headerRow2.querySelectorAll("th:not(:nth-child(-n))"));
    const subHeaderStartIndex = (fromUEIndex-3) * 5+3;
    const subHeadersToMove = subHeaders.slice(subHeaderStartIndex, subHeaderStartIndex + 5);

    subHeadersToMove.forEach(subHeader => {
        if (toUEIndex > fromUEIndex) {
            headerRow2.insertBefore(subHeader, subHeaders[(toUEIndex+1-3) * 5+3]);
        }
        else {
            headerRow2.insertBefore(subHeader, subHeaders[(toUEIndex+1-3) * 5-5+3]);
        }

    });

    // Déplacer les cellules de données pour chaque étudiant
    const rows = tbody.querySelectorAll("tr");
    rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll("td:not(:nth-child(-n))"));
        const cellsToMove = cells.slice(subHeaderStartIndex, subHeaderStartIndex + 5);

        cellsToMove.forEach(cell => {
            if (toUEIndex > fromUEIndex) {
                row.insertBefore(cell, cells[(toUEIndex+1-3) * 5+3]);
            }
            else {
                row.insertBefore(cell, cells[(toUEIndex+1-3) * 5-5+3]);
            }
        });
    });
}

function renderStudentsTable() {
    const tbody = document.getElementById("studentsTableBody");
    tbody.innerHTML = "";

    students.forEach(student => {
        const tr = document.createElement("tr");

        // Colonnes fixes
        const tdId = document.createElement("td");
        tdId.textContent = student.id;
        tdId.style.position = "sticky";
        tdId.style.left = "0";
        tdId.style.background = "white";
        tr.appendChild(tdId);

        const tdFirstName = document.createElement("td");
        tdFirstName.textContent = student.firstName;
        tdFirstName.style.position = "sticky";
        tdFirstName.style.left = "75px";
        tdFirstName.style.background = "white";
        tr.appendChild(tdFirstName);

        const tdLastName = document.createElement("td");
        tdLastName.textContent = student.lastName;
        tdLastName.style.position = "sticky";
        tdLastName.style.left = "150px";
        tdLastName.style.background = "white";
        tr.appendChild(tdLastName);

        teachingUnits.forEach(ue => {
            ["Inscrit", "CM", "CI", "TD", "TP"].forEach(type => {
                const td = document.createElement("td");
                if (type === "Inscrit" && student.teachingUnitIds.includes(ue.id)) {
                    td.textContent = "X";
                } else {
                    td.textContent = "";
                    td.classList.add("student-group-cell");
                    td.id = `${student.id}-${ue.id}-${type}`;
                }
                tr.appendChild(td);
            });
        });

        tbody.appendChild(tr);
    });
}

function fillStudentsGroups() {
    //we first reset all the group cells
    const cells = document.querySelectorAll(".student-group-cell");
    cells.forEach(cell => {
        cell.textContent = "";
    });
    allFixedEvents.forEach(e => {
        e.studentIds.forEach(studentId => {
            const cell = document.getElementById(`${studentId}-${e.teachingId}`);
            cell.textContent = e.groupId;
        })

    })
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