const prisma = require("../prisma/client");
const redisClient = require("../config/redis");

const getAllStates = async (name) => {
  const cacheKey = name ? `states:${name}` : "states";

  // 1. Check cache
  const cachedData = await redisClient.get(cacheKey);

  if (cachedData) {
    return JSON.parse(cachedData);
  }

  // 2. Fetch from DB
  const where = name
    ? {
        state_name: {
          contains: name,
          mode: "insensitive",
        },
      }
    : undefined;

  const states = await prisma.states.findMany({
    where,
    select: {
      state_code: true,
      state_name: true,
    },
    orderBy: {
      state_name: "asc",
    },
  });

  // 3. Store in cache (TTL = 1 hour)
  await redisClient.set(cacheKey, JSON.stringify(states), {
    EX: 3600,
  });

  return states;
};

const getStateVillageCounts = async (limit = 10) => {
  const normalizedLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const cacheKey = `states:village-counts:${normalizedLimit}`;

  const cachedData = await redisClient.get(cacheKey);
  if (cachedData) {
    return JSON.parse(cachedData);
  }

  const rows = await prisma.$queryRaw`
    SELECT
      s.state_code,
      s.state_name,
      COUNT(v.village_code)::int AS villages
    FROM states s
    LEFT JOIN districts d ON d.state_code = s.state_code
    LEFT JOIN villages v ON v.district_code = d.district_code
    GROUP BY s.state_code, s.state_name
    ORDER BY villages DESC, s.state_name ASC
    LIMIT ${normalizedLimit}
  `;

  await redisClient.set(cacheKey, JSON.stringify(rows), {
    EX: 3600,
  });

  return rows;
};

module.exports = { getAllStates, getStateVillageCounts };