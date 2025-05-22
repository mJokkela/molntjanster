// Login script
const loginForm = document.querySelector("form");
const loginButton = document.querySelector("button");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const wrongLoginMessage = document.querySelector(".wrong-login");

const elev = [
    { email: "elev1@student.com", password: "stud123", id: "S001" },
    { email: "elev2@student.com", password: "stud123", id: "S002" },
    { email: "elev3@student.com", password: "stud123", id: "S003" },
    { email: "elev4@student.com", password: "stud123", id: "S004" }
];

const larare = [
    { email: "larare@student.com", password: "larare123" }
];

const fakeUser = [...elev, ...larare];

loginButton.addEventListener("click", (e) => {
    e.preventDefault();

    const email = emailInput.value;
    const password = passwordInput.value;

    const isLarare = larare.some(u => u.email === email && u.password === password);
    const isElev = elev.some(u => u.email === email && u.password === password);

    if (isLarare) {
        window.location.href = "./hem.html";
    } else if (isElev) {
        const elevData = elev.find(u => u.email === email);
        window.location.href = `./elevindex.html?studentID=${elevData.id}`;
    } else {
        wrongLoginMessage.style.display = "block";
    }
});
