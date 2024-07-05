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

		const city2 = await fetch(`http://ip-api.com/json/${client_ip}`);
		// const addressResponse = await fetch(`http://ip-api.com/json/myipaddress`);
		const { city, lat, lon } = await addressResponse.json();

		if (!city) {
			return returnInternalError(res, `Failed to get location`);
		}

		const weatherDataQuery = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${process.env.OPEN_WEATHER_API_KEY}`;
		const { temp } = (await (await fetch(weatherDataQuery)).json()).main;

		if (!temp) return returnInternalError(res, "Oops, Please try again later");

		res.status(200).json({
			client_ip,
			location: city,
			greeting: `Hello, ${visitor_name}!, The temperature is ${Math.round(
				temp
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
