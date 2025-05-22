import { initDatabase, getDB, saveDatabase } from './db.js';

const isTeacher = false; // Hårdkodat för nu
let db;

window.addEventListener("message", async (event) => {
    if (event.data.studentID) {
        console.log("Tar emot studentID:", event.data.studentID);

        if (!db) {
            db = await initDatabase();
        }

        // OBS: Se till att db INTE är null innan prepare körs
        if (db) {
            loadAssessmentsForStudent(event.data.studentID);
        } else {
            console.error("DB är fortfarande null vid anrop!");
        }
    }
});





initDatabase().then(d => {
    db = d;

    //  Kontrollera att tabellen finns innan du gör SELECT
    try {
        const result = db.exec("SELECT * FROM assessments");
        console.log(result);
    } catch (err) {
        console.error("Kunde inte läsa från tabellen:", err.message);
    }
});

function saveCourse(name, grade) {
    db.run("INSERT INTO courses (name, grade) VALUES (?, ?)", [name, grade]);
    saveDatabase();
    alert("Sparat!");
}

window.saveCourse = saveCourse;

function addAssessmentRow() {
    const studentSelect = document.getElementById('student-select');
    const courseSelect = document.getElementById('course-select');
    const gradeSelect = document.getElementById('grade-select');

    const student = studentSelect.value;
    const course = courseSelect.value;
    const grade = gradeSelect.value;

    if (!student || !course || !grade) {
        alert("Välj studerande, kurs och betyg");
        return;
    }

    const tableBody = document.getElementById('table-body');
    const rowId = Date.now();

    const row = document.createElement('tr');
    row.id = `row-${rowId}`;

    row.innerHTML = `
        <td>${student}</td>
        <td>${course}</td>
        <td>${grade}</td>
        <td><textarea name="comment" rows="3" cols="30"></textarea></td>
        ${isTeacher ? `<td><button onclick="removeRow('${rowId}')">Ta bort</button></td>` : `<td>-</td>`}
    `;

    tableBody.appendChild(row);

    // Återställ val
    studentSelect.selectedIndex = 0;
    courseSelect.selectedIndex = 0;
    gradeSelect.selectedIndex = 0;

    // Inaktivera dropdowns så att man inte kan lägga till fler förrän man sparar
    document.getElementById('student-select').disabled = true;
    document.getElementById('course-select').disabled = true;
    document.getElementById('grade-select').disabled = true;

    // Inaktivera Lägg till-knappen
    const addButton = document.querySelector("button[onclick='addAssessmentRow()']");
    if (addButton) {
        addButton.disabled = true;
    }
}

window.addAssessmentRow = addAssessmentRow;

function removeRow(rowId) {
    const row = document.getElementById(`row-${rowId}`);
    if (row) {
        row.remove();
    }

    const remainingRows = document.querySelectorAll("#table-body tr").length;

    if (remainingRows === 0) {
        // Aktivera dropdowns och knapp igen
        document.getElementById('student-select').disabled = false;
        document.getElementById('course-select').disabled = false;
        document.getElementById('grade-select').disabled = false;

        const addButton = document.querySelector("button[onclick='addAssessmentRow()']");
        if (addButton) {
            addButton.disabled = false;
        }
    }
}

window.removeRow = removeRow;

function saveAssessments() {
    const db = getDB();
    const rows = document.querySelectorAll("#table-body tr");

    let saved = 0;
    const teacherID = "T001"; // Hårdkodat tills vidare

    rows.forEach(row => {
        const cells = row.querySelectorAll("td");

        const studentID = cells[0]?.innerText.trim();
        const courseID = cells[1]?.innerText.trim();
        const gradeID = cells[2]?.innerText.trim();
        const comment = cells[3]?.querySelector("textarea")?.value.trim();

        if (studentID && courseID && gradeID) {
            db.run(
                `INSERT INTO assessments (studentID, teacherID, courseID, gradeID, comment)
         VALUES (?, ?, ?, ?, ?)`,
                [studentID, teacherID, courseID, gradeID, comment]
            );

            // Lås kommentarsfältet
            cells[3].querySelector("textarea").disabled = true;
            saved++;
        }
    });

    saveDatabase();

    // Aktivera formuläret igen
    document.getElementById('student-select').disabled = false;
    document.getElementById('course-select').disabled = false;
    document.getElementById('grade-select').disabled = false;
    document.querySelector("button[onclick='addAssessmentRow()']").disabled = false;

    alert(`${saved} bedömningar sparade i databasen!`);
}


window.saveAssessments = saveAssessments; //  gör den global

function loadAssessmentsForStudent(studentID) {
    if (!db) {
        console.error("Databas ej laddad när loadAssessmentsForStudent kallades!");
        return;
    }
    const tableBody = document.getElementById("table-body");
    tableBody.innerHTML = ""; // töm tidigare rader

    const stmt = db.prepare(`
        SELECT 
          l.firstName || ' ' || l.lastName AS teacherName,
          c.courseName,
          g.grade,
          a.comment,
          a.timestamp
        FROM assessments a
        JOIN teachers l ON a.teacherID = l.teacherID
        JOIN courses c ON a.courseID = c.courseID
        JOIN grades g ON a.gradeID = g.gradeID
        WHERE a.studentID = ?
        `);

    stmt.bind([studentID]);

    while (stmt.step()) {
        const row = stmt.getAsObject();
        console.log("ROW:", row);  
        const rowId = Date.now() + Math.random();

        const tr = document.createElement("tr");
        tr.id = `row-${rowId}`;
        tr.innerHTML = `
          <td>${row.teacherName}</td>
          <td>${row.courseName}</td>
          <td>${row.grade}</td>
          <td><textarea rows="3" cols="30" disabled>${row.comment}</textarea></td>
         <td>${new Date(row.timestamp).toLocaleDateString("sv-SE", {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</td>
        `;

        tableBody.appendChild(tr);
    }

    stmt.free();
}

window.loadAssessmentsForStudent = loadAssessmentsForStudent;

// window.addEventListener("message", async (event) => {
//     if (event.data.studentID) {
//         console.log("Tar emot studentID:", event.data.studentID);

//         if (!db) {
//             db = await initDatabase();
//         }

//         loadAssessmentsForStudent(event.data.studentID);
//     }
// });
