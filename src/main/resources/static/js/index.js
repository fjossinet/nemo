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

