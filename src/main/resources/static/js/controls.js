document.getElementById("saveTeachingUnitsBtn").addEventListener("click", async (event) => {
    event.preventDefault();
    await saveTeachingUnits();
});

document.getElementById("updateSemesterMondays").addEventListener("click", async (event) => {
    event.preventDefault();
    firstMondayInSemester = new Date(document.getElementById("firstMondayInSemester").value)
    if (firstMondayInSemester.getDay() !== 1) {
        const msgEl = document.getElementById("saveSettingsMessage");
        msgEl.textContent = "Attention, le début du semestre n'est pas un lundi!";
        msgEl.style.color = "crimson";
        return
    }

    lastMondayInSemester = new Date(document.getElementById("lastMondayInSemester").value)
    if (lastMondayInSemester.getDay() !== 1) {
        const msgEl = document.getElementById("saveSettingsMessage");
        msgEl.textContent = "Attention, la fin du semestre n'est pas un lundi!";
        msgEl.style.color = "crimson";
        return
    }

    if (lastMondayInSemester < firstMondayInSemester) {
        const msgEl = document.getElementById("saveSettingsMessage");
        msgEl.textContent = "Attention, la fin du semestre est avant le début!";
        msgEl.style.color = "crimson";
        return
    }
    
    if (lastSelectedTeaching != null) {
        generateTimeConstraintsTable(lastSelectedTeaching);
    }
    refreshCalendar();
    await saveSettings();
});

document.getElementById("addUEBtn").addEventListener("click", () => {

    const id = document.getElementById("ueId").value;
    const name = document.getElementById("ueName").value;

    if (!id || !name) {
        alert("UE incomplète");
        return;
    }

    teachingUnits.push({
        id: id,
        name: name,
        teachings: []
    });

    updateTeachingUnitSelect();
});
document.getElementById("addTeachingBtn").addEventListener("click", () => {

    const unitId = document.getElementById("teachingUnitSelect").value;

    if (!unitId) {
        alert("Sélectionnez une UE");
        return;
    }

    const type = document.getElementById("teachingType").value;

    const ue = teachingUnits.find(u => u.id === unitId);

    const teaching = {
        id: `${unitId}-${type}`,
        unitId: unitId,
        type: type,
        sessions: Number(document.getElementById("sessions").value),
        startDate: document.getElementById("startDate").value,
        durationMinutes: Number(document.getElementById("duration").value),
        groupCapacity: Number(document.getElementById("groupCapacity").value),
        teacherCount: Number(document.getElementById("teacherCount").value)
    };

    ue.teachings.push(teaching);
    teachings.push(teaching);

    renderTeachingTable();
});

function updateTeachingUnitSelect() {

    const select = document.getElementById("teachingUnitSelect");

    // On garde la première option
    select.innerHTML = `<option value="">— sélectionner une UE —</option>`;

    teachingUnits.forEach(ue => {
        const option = document.createElement("option");
        option.value = ue.id;
        option.textContent = `${ue.id} — ${ue.name}`;
        select.appendChild(option);
    });
}

