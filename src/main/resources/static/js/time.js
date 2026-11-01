/**
 * Ensemble des lundis de semaines de vacances, au format "YYYY-MM-DD".
 * @returns {Set<string>}
 */
function getHolidayMondaysSet() {
    const holidays = (typeof holidayMondays !== "undefined" && Array.isArray(holidayMondays))
        ? holidayMondays
        : [];
    return new Set(holidays.map(d => formatDate(getMonday(new Date(d)))));
}

/**
 * Indique si la semaine commençant ce lundi est une semaine de vacances.
 * @param date n'importe quelle date de la semaine
 * @returns {boolean}
 */
function isHolidayMonday(date) {
    return getHolidayMondaysSet().has(formatDate(getMonday(date)));
}

/**
 * Trie la liste globale holidayMondays par ordre chronologique
 * (les dates au format "YYYY-MM-DD" se trient correctement par ordre alphabétique).
 */
function sortHolidayMondays() {
    holidayMondays.sort();
}

/**
 * Liste de tous les lundis des semaines du semestre (vacances incluses).
 * @param {Date} firstMonday
 * @param {Date} lastMonday
 * @returns {Date[]}
 */
function getAllWeekMondays(firstMonday, lastMonday) {
    if (firstMonday.getDay() !== 1 || lastMonday.getDay() !== 1) {
        throw new Error("Les deux dates doivent être des lundis.");
    }
    const mondays = [];
    const monday = getMonday(firstMonday);
    const last = getMonday(lastMonday);
    while (monday <= last) {
        mondays.push(new Date(monday));
        monday.setDate(monday.getDate() + 7);
    }
    return mondays;
}

/**
 * Liste des lundis des semaines du semestre SANS les semaines de vacances.
 * Seules ces semaines sont nommées S1, S2, ...
 * @param {Date} firstMonday
 * @param {Date} lastMonday
 * @returns {Date[]}
 */
function getNonHolidayWeekMondays(firstMonday, lastMonday) {
    return getAllWeekMondays(firstMonday, lastMonday).filter(d => !isHolidayMonday(d));
}

/**
 * Transforme une semaine en "S2" par exemple en date du lundi.
 * "S2" désigne la 2ème semaine SANS vacances du semestre.
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

    const weeks = getNonHolidayWeekMondays(firstMondayAsDate, lastMondayInSemester);
    if (weekNumber > weeks.length) {
        throw new Error(`La semaine ${weekString} n'existe pas dans le semestre`);
    }
    return weeks[weekNumber - 1];
}

/**
 * Donne le nom ("S1", "S2", ...) d'une semaine du semestre.
 * Seules les semaines sans vacances sont nommées ; une semaine de vacances
 * (ou hors semestre) retourne null.
 * @param firstMondayAsDate as a Date
 * @param monday un lundi
 * @returns {string|null}
 */
function getWeekStringFromMonday(firstMondayAsDate, monday) {
    if (monday.getDay() !== 1) {
        throw new Error("La date fournie n'est pas un lundi.");
    }
    const weeks = getNonHolidayWeekMondays(firstMondayAsDate, lastMondayInSemester);
    const index = weeks.findIndex(d => formatDate(d) === formatDate(getMonday(monday)));
    return index === -1 ? null : `S${index + 1}`;
}

/**
 * Ramène currentMondayInSemester sur la semaine sans vacances la plus proche
 * (utile si la semaine courante devient une semaine de vacances).
 */
function ensureCurrentMondayIsTeachingWeek() {
    const weeks = getNonHolidayWeekMondays(firstMondayInSemester, lastMondayInSemester);
    if (weeks.length === 0) return;
    if (!isHolidayMonday(currentMondayInSemester)
        && formatDate(currentMondayInSemester) >= formatDate(weeks[0])
        && formatDate(currentMondayInSemester) <= formatDate(weeks[weeks.length - 1])) {
        return;
    }
    let nearest = weeks[0];
    weeks.forEach(w => {
        if (Math.abs(w - currentMondayInSemester) < Math.abs(nearest - currentMondayInSemester)) {
            nearest = w;
        }
    });
    currentMondayInSemester = nearest;
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
    if (teaching.sessionsPerWeek > 0) {
        // Cas classique : sessions réparties sur plusieurs semaines
        weeksNeeded = teaching.sessions;
        weeksNeeded = Math.ceil(weeksNeeded/teaching.sessionsPerWeek)
    } else {
        // Cas sessionsPerWeek = 0 : 1 groupe suit toutes les sessions en 1 semaine
        // weeksNeeded = nombre de groupes = ceil(nombre d'étudiants / groupCapacity)
        weeksNeeded = Math.ceil(getStudentCountForTeaching(teaching.id.split("-")[0]) / teaching.groupCapacity);
    }

    // Semaines du semestre sans vacances, nommées S1, S2, ...
    const semesterWeeks = getNonHolidayWeekMondays(firstMondayInSemester, lastMondayInSemester)
        .map(d => getWeekStringFromMonday(firstMondayInSemester, d));

    // On part de la semaine de début de l'enseignement (S1 par défaut si inconnue)
    let startIndex = semesterWeeks.indexOf(teaching.startDate);
    if (startIndex === -1) startIndex = 0;

    // On avance dans les semaines sans vacances jusqu'à avoir assez de semaines disponibles
    // (une semaine est disponible si au moins une contrainte de temps y existe)
    let weeksCount = 0;
    let unavailableWeeksCount = 0;
    let totalWeeksCount = 0;
    while (weeksCount < weeksNeeded && startIndex + totalWeeksCount < semesterWeeks.length) {
        const weekLabel = semesterWeeks[startIndex + totalWeeksCount];
        if ((teaching.timeConstraints || []).some(constraint => constraint.week === weekLabel)) {
            weeksCount++;
            teaching.weeks.push(weekLabel);
        } else {
            unavailableWeeksCount++;
        }
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