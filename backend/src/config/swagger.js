const swaggerJsdoc = require("swagger-jsdoc");

const options = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "India Geo API",
			version: "1.0.0",
			description: "API for accessing India village-level geographical data",
		},
		servers: [
			{
				url: "https://india-geo-api.onrender.com",
			},
		],
	},
	apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
