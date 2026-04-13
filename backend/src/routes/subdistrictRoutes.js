const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const { getVillagesBySubdistrict } = require("../controllers/villageController");

const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10);
const RATE_LIMIT_VILLAGES_MAX = parseInt(process.env.RATE_LIMIT_VILLAGES_MAX || "30", 10);

const villagesLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_VILLAGES_MAX,
  message: "Too many village requests, try later",
});

/**
 * @swagger
 * /subdistricts/{subdistrictId}/villages:
 *   get:
 *     summary: Get villages by subdistrict ID
 *     description: Returns paginated villages for a given subdistrict
 *     parameters:
 *       - in: path
 *         name: subdistrictId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/:subdistrictId/villages", villagesLimiter, getVillagesBySubdistrict);

module.exports = router;
