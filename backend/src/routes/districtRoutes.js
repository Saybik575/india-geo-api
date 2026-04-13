const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const { getSubdistrictsByDistrict } = require("../controllers/subdistrictController");

const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10);
const RATE_LIMIT_DISTRICT_SUBDISTRICTS_MAX = parseInt(process.env.RATE_LIMIT_DISTRICT_SUBDISTRICTS_MAX || "60", 10);

const districtSubdistrictsLimiter = rateLimit({
	windowMs: RATE_LIMIT_WINDOW_MS,
	max: RATE_LIMIT_DISTRICT_SUBDISTRICTS_MAX,
	message: "Too many subdistrict lookup requests, try later",
});

/**
 * @swagger
 * /districts/{districtId}/subdistricts:
 *   get:
 *     summary: Get subdistricts by district ID
 *     description: Returns list of subdistricts for a given district
 *     parameters:
 *       - in: path
 *         name: districtId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/:districtId/subdistricts", districtSubdistrictsLimiter, getSubdistrictsByDistrict);

module.exports = router;
