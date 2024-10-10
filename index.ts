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

app.get("/", (req, res) => {
	return res.send({ ok: true });
});

app.post("/points", (req, res) => {
	try {
	if (req.body.command === '/award') {
		const [username, points] = req.body.text.split(' ');
		const parsed = parseInt(points);
		if (isNaN(parsed)) {
			throw new Error("why");
		}
		if (!db[username]) {
			db[username] = parsed;
		} else {
			db[username] = db[username] + parsed;
		}
		writeFileSync('./db.txt', JSON.stringify(db));
		return res.send({ response_type: "in_channel", text: `${username} now has ${db[username]} points` });
	} else if (req.body.command === '/points') {
		const username = req.body.text;
		if (!username) {
			const everyone = Object.entries(db).map(([k,v]) => `${k}: ${v} points`).join('\n');
			return res.send({ response_type: "in_channel", text: everyone });
		}
		const points = db[username] ?? 0;
		return res.send({ response_type: "in_channel", text: `${username} has ${points} points` });
	}
	} catch (err) {
		console.error(err);
		return res.send({ response_type: "in_channel", text: "I don't know what to do with that" });
	}
});

app.listen(5000, () => console.log("listening on 5000"));
