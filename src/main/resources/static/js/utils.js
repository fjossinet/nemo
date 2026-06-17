function getHueForUnit(unitId) {
    if (unitHues[unitId]) {
        return unitHues[unitId];
    }

    // Utiliser une fonction de hachage plus robuste
    let hash = 5381; // Valeur initiale classique pour le hachage djb2
    for (let i = 0; i < unitId.length; i++) {
        hash = (hash * 33) ^ unitId.charCodeAt(i);
    }

    // Répartir les teintes de manière plus uniforme
    const hue = Math.abs(hash) % 360;

    // Éviter les teintes trop proches en forçant un écart minimum
    // (optionnel : ajuster si nécessaire)
    const minHueDifference = 30; // Écart minimum entre deux teintes
    const existingHues = Object.values(unitHues);
    let finalHue = hue;

    // Vérifier si la teinte est trop proche d'une teinte existante
    for (const existingHue of existingHues) {
        const difference = Math.abs(existingHue - finalHue);
        if (difference < minHueDifference || difference > 360 - minHueDifference) {
            finalHue = (finalHue + minHueDifference) % 360;
        }
    }

    unitHues[unitId] = finalHue;
    return finalHue;
}

/**
 * Retourne le nombre d'étudiants suivant un enseignement basé sur son teachingUnitId (ex: PAD, GEX, APBC)
 * @param teachingUnitId
 * @returns {number}
 */
function getStudentCountForTeaching(teachingUnitId) {
    return students.filter(student =>
        student.teachingUnitIds.includes(teachingUnitId)
    ).length
}