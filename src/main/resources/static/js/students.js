function initStudents() {
    generateStudentsTableHeaders(teachingUnits);
    renderStudentsTable()
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