/**
 * Affiche les semaines de vacances dans le formulaire du semestre :
 * un champ date par lundi de vacances, plus un bouton de suppression.
 */
function renderHolidayMondaysInputs() {
    const container = document.getElementById("holidayMondaysContainer");
    if (!container) return;
    container.innerHTML = "";

    holidayMondays.forEach((monday, index) => {
        const row = document.createElement("div");
        row.style.marginTop = "0.3rem";

        const input = document.createElement("input");
        input.type = "date";
        input.value = monday;
        input.dataset.index = index;
        input.addEventListener("change", () => {
            holidayMondays[index] = input.value;
            sortHolidayMondays();
            renderHolidayMondaysInputs();
        });

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.textContent = "Supprimer";
        removeBtn.style.marginLeft = "0.5rem";
        removeBtn.addEventListener("click", () => {
            holidayMondays.splice(index, 1);
            renderHolidayMondaysInputs();
        });

        row.appendChild(input);
        row.appendChild(removeBtn);
        container.appendChild(row);
    });
}

document.getElementById("addHolidayBtn").addEventListener("click", () => {
    // Par défaut : le lundi suivant le dernier lundi de vacances connu,
    // ou le premier lundi du semestre
    let next = new Date(firstMondayInSemester);
    if (holidayMondays.length > 0) {
        next = new Date(holidayMondays[holidayMondays.length - 1]);
        next.setDate(next.getDate() + 7);
    }
    holidayMondays.push(formatDate(getMonday(next)));
    sortHolidayMondays();
    renderHolidayMondaysInputs();
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

    // Récupère les semaines de vacances saisies dans le formulaire
    holidayMondays = Array.from(document.querySelectorAll("#holidayMondaysContainer input[type=date]"))
        .map(input => input.value)
        .filter(v => v);
    sortHolidayMondays();

    ensureCurrentMondayIsTeachingWeek();

    if (lastSelectedTeaching != null) {
        generateTimeConstraintsTable(lastSelectedTeaching);
    }
    refreshCalendar();
    await saveSettings();
});
