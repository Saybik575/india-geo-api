const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const { getStates } = require("../controllers/stateController");
const { getDistrictsByState } = require("../controllers/districtController");

const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10);
const RATE_LIMIT_STATES_MAX = parseInt(process.env.RATE_LIMIT_STATES_MAX || "120", 10);
const RATE_LIMIT_STATE_DISTRICTS_MAX = parseInt(process.env.RATE_LIMIT_STATE_DISTRICTS_MAX || "80", 10);

const statesLimiter = rateLimit({
	windowMs: RATE_LIMIT_WINDOW_MS,
	max: RATE_LIMIT_STATES_MAX,
	message: "Too many state list requests, try later",
});

const stateDistrictsLimiter = rateLimit({
	windowMs: RATE_LIMIT_WINDOW_MS,
	max: RATE_LIMIT_STATE_DISTRICTS_MAX,
	message: "Too many district lookup requests, try later",
});

/**
 * @swagger
 * /states:
 *   get:
 *     summary: Get all states
 *     description: Returns list of all states
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/", statesLimiter, getStates);

/**
 * @swagger
 * /states/{stateId}/districts:
 *   get:
 *     summary: Get districts by state ID
 *     description: Returns list of districts for a given state
 *     parameters:
 *       - in: path
 *         name: stateId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/:stateId/districts", stateDistrictsLimiter, getDistrictsByState);

module.exports = router;