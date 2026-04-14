const prisma = require("../prisma/client");
const redisClient = require("../config/redis");

const getDistrictsByStateId = async (stateId, name) => {
  const cacheKey = name ? `districts:${stateId}:${name}` : `districts:${stateId}`;

  // 1. Check cache
  const cachedData = await redisClient.get(cacheKey);
  if (cachedData) {
    return JSON.parse(cachedData);
  }

  // 2. Fetch from DB
  const where = {
    state_code: stateId,
    ...(name
      ? {
          district_name: {
            contains: name,
            mode: "insensitive",
          },
        }
      : {}),
  };

  const districts = await prisma.districts.findMany({
    where,
    select: {
      district_code: true,
      district_name: true,
      state_code: true,
      states: {
        select: {
          state_name: true,
        },
      },
    },
    orderBy: { district_name: "asc" },
  });

  // 3. Transform to include state name
  const transformedDistricts = districts.map((district) => ({
    district_code: district.district_code,
    district_name: district.district_name,
    state_code: district.state_code,
    state_name: district.states?.state_name || "",
  }));

  // 4. Store in cache (TTL = 1 hour)
  await redisClient.set(cacheKey, JSON.stringify(transformedDistricts), {
    EX: 3600,
  });

  return transformedDistricts;
};

const searchDistrictsByName = async (name) => {
  const normalizedName = typeof name === "string" ? name.trim() : "";

  if (!normalizedName) {
    return [];
  }

  const cacheKey = `districts:search:${normalizedName.toLowerCase()}`;
  const cachedData = await redisClient.get(cacheKey);

  if (cachedData) {
    return JSON.parse(cachedData);
  }

  const districts = await prisma.districts.findMany({
    where: {
      district_name: {
        contains: normalizedName,
        mode: "insensitive",
      },
    },
    select: {
      district_code: true,
      district_name: true,
      state_code: true,
      states: {
        select: {
          state_name: true,
        },
      },
    },
    orderBy: { district_name: "asc" },
    take: 20,
  });

  const transformedDistricts = districts.map((district) => ({
    district_code: district.district_code,
    district_name: district.district_name,
    state_code: district.state_code,
    state_name: district.states?.state_name || "",
  }));

  await redisClient.set(cacheKey, JSON.stringify(transformedDistricts), {
    EX: 3600,
  });

  return transformedDistricts;
};

module.exports = { getDistrictsByStateId, searchDistrictsByName };
