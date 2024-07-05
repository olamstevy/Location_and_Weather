const express = require("express");
require("dotenv").config();
const requestIp = require("request-ip");

const app = express();
app.use(express.json());

app.get("/api/hello/", async (req, res) => {
	// Getting visitor name
	let { visitor_name } = req?.query;
	if (!visitor_name)
		return res.status(400).json({
			message: `"visitor_name" does not exist in query param`,
		});
	visitor_name = visitor_name.replaceAll(`"`, "");

	const client_ip = requestIp.getClientIp(req);

	const { city, latitude, longitude } = await (
		await fetch(`https://ipapi.co/${client_ip}/json`)
	).json();

	if (!city)
		return res.status(500).json({
			message: `Failed to get your location from your ip address: "${client_ip}"`,
		});

	const weatherDataQuery = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${process.env.OPEN_WEATHER_API_KEY}`;
	const { temp } = (await (await fetch(weatherDataQuery)).json()).main;

	if (!temp)
		return res
			.status(500)
			.json({ message: "Failed to get weather data. Please try again later" });

	res.status(200).json({
		client_ip,
		location: city,
		greeting: `Hello, ${visitor_name}!, The temperature is ${Math.round(
			temp
		)} degrees Celcius in ${city}`,
	});
});

app.use((req, res) => {
	res.status(404).send("The endpoint you hit is not valid");
});

app.listen(process.env.PORT, () => {
	console.log(`listenening at port ${process.env.PORT}`);
});
