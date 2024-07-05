const express = require("express");
require("dotenv").config();
const requestIp = require("request-ip");

// Initialize app and middleware
const app = express();
app.use(express.json());

const returnInternalError = (res, message) =>
	res.status(500).json({ error: message });

// Required endpoint
app.get("/api/hello/", async (req, res) => {
	try {
		// Getting visitor name
		let { visitor_name } = req?.query;
		if (!visitor_name)
			return res.status(400).json({ message: "visitor_name is required" });
		visitor_name = visitor_name.replaceAll(`"`, "");

		// Get client geo data
		const client_ip = requestIp.getClientIp(req);
		const ipapiResponse = await fetch(`https://ipapi.co/${client_ip}/json`);
		const { city, latitude, longitude } = await ipapiResponse.json();

		if (!city) return returnInternalError(res, "Failed to get location");

		const weatherDataQuery = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${process.env.OPEN_WEATHER_API_KEY}`;
		const { temperature } = (await (await fetch(weatherDataQuery)).json()).main;

		if (!temperature)
			return returnInternalError(res, "Oops, Please try again later");

		res.status(200).json({
			client_ip,
			location: city,
			greeting: `Hello, ${visitor_name}!, The temperature is ${Math.round(
				temperature
			)} degrees Celcius in ${city}`,
		});
	} catch (err) {
		console.error(err);
		res.status(500).json("An error occured while processing your request");
	}
});

app.use((req, res) => {
	res.status(404).send("The endpoint you hit is not valid");
});

app.listen(process.env.PORT, () => {
	console.log(`listenening at port ${process.env.PORT}`);
});
