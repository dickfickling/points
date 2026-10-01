import express, { json } from "express";
import { readFileSync, writeFileSync } from 'fs';

console.log("foo");

const file = readFileSync('./db.txt', 'utf-8');
let db: Record<string, number> = {};
try {
	db = JSON.parse(file);
} catch (err) {
	console.log("file is invalid", file);
}

const app = express();

app.use( json({ limit: 1 * 1024 * 1024, }),);
app.use(express.urlencoded({ extended: true }));

const savePoints = () => {
	writeFileSync('./db.txt', JSON.stringify(db));
};

const awardPoints = (text: string) => {
	const [username, points, reason] = text.split(' ');

	if (!username || !points) {
		throw new Error("why");
	}

	let parsed = parseInt(points);

	if (reason === "random") {
		parsed = Math.ceil(Math.random() * parsed);
	}

	if (isNaN(parsed)) {
		throw new Error("why");
	}

	db[username] = (db[username] ?? 0) + parsed;
	savePoints();

	return `${reason === "random" ? `Awarded ${username} ${parsed} points at random. ` : ''}${username} now has ${db[username]} points`;
};

const getPoints = (username: string) => {
	if (!username) {
		return Object.entries(db).sort((a, b) => b[1] - a[1]).map(([k,v]) => `${k}: ${v} points`).join('\n');
	}

	const points = db[username] ?? 0;

	return `${username} has ${points} points`;
};

const transferPoints = (text: string, fromUsername: string) => {
	const [toUsername, points] = text.split(' ');
	const parsed = Number(points);

	if (!fromUsername || !toUsername || !Number.isInteger(parsed) || parsed <= 0 || fromUsername === toUsername) {
		throw new Error("why");
	}

	const fromPoints = db[fromUsername] ?? 0;

	if (fromPoints < parsed) {
		throw new Error("why");
	}

	db[fromUsername] = fromPoints - parsed;
	db[toUsername] = (db[toUsername] ?? 0) + parsed;
	savePoints();

	return `${fromUsername} now has ${db[fromUsername]} points and ${toUsername} now has ${db[toUsername]} points`;
};

const commands: Record<string, (text: string, fromUsername: string) => string> = {
	'/award': awardPoints,
	'/points': getPoints,
	'/transfer': transferPoints,
};

app.get("/", (req, res) => {
	return res.send({ ok: true });
});

app.post("/points", (req, res) => {
	console.log(req.body);
	try {
		const command = commands[req.body.command];

		if (!command) {
			throw new Error("why");
		}

		const text = command(req.body.text, req.body.user_name);

		return res.send({ response_type: "in_channel", text });
	} catch (err) {
		console.error(err);

		return res.send({ response_type: "in_channel", text: "I don't know what to do with that" });
	}
});

app.listen(5000, () => console.log("listening on 5000"));
