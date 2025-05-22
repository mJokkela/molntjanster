let db = null;
let SQL = null;

export async function initDatabase() {
    SQL = await initSqlJs({
        locateFile: file => `https://cdn.jsdelivr.net/npm/sql.js@1.6.2/dist/${file}`
    });

    const request = indexedDB.open("AssessmentDB", 1);

    return new Promise((resolve, reject) => {
        request.onerror = () => reject("Kunde inte öppna IndexedDB");

        request.onsuccess = async () => {
            const idb = request.result;
            const tx = idb.transaction(["sqlite"], "readonly");
            const store = tx.objectStore("sqlite");
            const getRequest = store.get("school");

            getRequest.onsuccess = () => {
                const saved = getRequest.result;
                if (saved) {
                    db = new SQL.Database(new Uint8Array(saved));
                    console.log("Databas laddad från IndexedDB!");
                } else {
                    fetch("db/school.db")
                        .then(res => res.arrayBuffer())
                        .then(buffer => {
                            db = new SQL.Database(new Uint8Array(buffer));
                            console.log("Databas laddad från school.db");

                            // Spara till IndexedDB direkt
                            const txSave = idb.transaction(["sqlite"], "readwrite");
                            txSave.objectStore("sqlite").put(buffer, "school");

                            resolve(db);
                        })
                        .catch(err => {
                            console.error("Misslyckades att ladda school.db", err);
                            db = new SQL.Database(); // fallback
                            resolve(db);
                        });
                }
                resolve(db);
            };
        };

        request.onupgradeneeded = () => {
            const idb = request.result;
            idb.createObjectStore("sqlite");
        };
    });
}

export function saveDatabase() {
    return new Promise((resolve) => {
        if (!db) return resolve();
        const data = db.export();
        const request = indexedDB.open("AssessmentDB", 1);
        request.onsuccess = () => {
            const idb = request.result;
            const tx = idb.transaction(["sqlite"], "readwrite");
            const store = tx.objectStore("sqlite");
            store.put(data, "school");
            console.log("Databas sparad till IndexedDB.");
            resolve();
        };
    });
}

export function getDB() {
    return db;
}
