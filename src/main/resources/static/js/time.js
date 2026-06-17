/**
 * Transforme une semaine en "S2" par exemple en date du lundi
 * @param firstMondayAsDate as a Date
 * @param weekString a string describing a week like "S1" or "S2"
 * @returns {Date}
 */
function getMondayFromWeekString(firstMondayAsDate, weekString) {
    if (!weekString.startsWith("S")) {
        throw new Error("Le format de la semaine doit commencer par 'S' (ex: S1, S2)");
    }
    const weekNumber = parseInt(weekString.substring(1), 10);
    if (isNaN(weekNumber) || weekNumber < 1) {
        throw new Error("Le numéro de semaine doit être un entier positif");
    }

    const firstMonday = getMonday(firstMondayAsDate);
    const monday = new Date(firstMonday);
    monday.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);

    return monday;
}

function getWeekStringFromMonday(firstMondayAsDate, monday) {
    if (monday.getDay() !== 1) {
        throw new Error("La date fournie n'est pas un lundi.");
    }

    const diffTime = monday.getTime() - firstMondayAsDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    const weekNumber = Math.floor(diffDays / 7) + 1;

    return `S${weekNumber}`;
}


function getMonday(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0)
    const day = d.getDay(); // 0=dimanche, 1=lundi
    const diff = (day === 0 ? -6 : 1) - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function minutesToTime(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/**
 * Calcule le nombre de semaines entre deux dates de lundi (incluses).
 * @param {Date} firstMonday - Date du premier lundi
 * @param {Date} lastMonday - Date du dernier lundi
 * @returns {number} - Nombre de semaines entre les deux dates (incluses).
 */
function getWeekCountBetweenMondays(firstMonday, lastMonday) {
    // Vérifier que les deux dates sont bien des lundis
    if (firstMonday.getDay() !== 1 || lastMonday.getDay() !== 1) {
        throw new Error("Les deux dates doivent être des lundis.");
    }

    const diffTime = lastMonday.getTime() - firstMonday.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    const weekCount = Math.floor(diffDays / 7) + 1;

    return weekCount;
}

/**
 * Retourne le nombre de semaines sur lequel s'étale un enseignement (soit le nombre de sessions de cet enseignement, soit le nombre de groupes)
 * @param teaching
 * @returns {number}
 */

function getWeeksNeeded(teaching) {
    teaching.weeks = [];
    let weeksNeeded;
    let weeksCount = 0;
    let unavailableWeeksCount = 0;
    if (teaching.sessionsPerWeek > 0) {
        // Cas classique : sessions réparties sur plusieurs semaines
        weeksNeeded = teaching.sessions;
        weeksNeeded = Math.ceil(weeksNeeded/teaching.sessionsPerWeek)
    } else {
        // Cas sessionsPerWeek = 0 : 1 groupe suit toutes les sessions en 1 semaine
        // weeksNeeded = nombre de groupes = ceil(nombre d'étudiants / groupCapacity)
        weeksNeeded = Math.ceil(getStudentCountForTeaching(teaching.id.split("-")[0]) / teaching.groupCapacity);
    }

    //how many weeks do we need to reach to weeksNeeded with available weeks only?
    const firstWeekForTeaching = parseInt(getWeekStringFromMonday(firstMondayInSemester, teaching.startDate).substring(1));
    let totalWeeksCount = 0
    while (weeksCount < weeksNeeded) {
        //if at least one constraint with this week, then it's available
        if ((teaching.timeConstraints || []).some(constraint => {if (constraint.week === "S"+(firstWeekForTeaching+totalWeeksCount)) {return true}})) {
            weeksCount++;
            teaching.weeks.push("S"+(firstWeekForTeaching+totalWeeksCount));
        } else
            unavailableWeeksCount++
        totalWeeksCount++;
    }
    return [totalWeeksCount, unavailableWeeksCount]
}

/**
 * reduce list of minutes range
 * @param minutes_ranges
 * @returns {*[]}
 */
function mergeContiguousMinutesRanges(minutes_ranges) {
    if (!minutes_ranges.length) return [];

    const sorted = [...minutes_ranges].sort((a, b) => a[0] - b[0]);
    const merged = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
        const [start, end] = sorted[i];
        const last = merged[merged.length - 1];

        if (start <= last[1]) {
            last[1] = Math.max(last[1], end);
        } else {
            merged.push([start, end]);
        }
    }

    return merged;
}