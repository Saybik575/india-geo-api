const prisma = require("../prisma/client");
const redisClient = require("../config/redis");

const getSubdistrictsByDistrictId = async (districtId, name) => {
  const cacheKey = name ? `subdistricts:${districtId}:${name}` : `subdistricts:${districtId}`;

  // 1. Check cache
  const cachedData = await redisClient.get(cacheKey);
  if (cachedData) {
    return JSON.parse(cachedData);
  }

  // 2. Fetch from DB
  const where = {
    district_code: districtId,
    ...(name
      ? {
          subdistrict_name: {
            contains: name,
            mode: "insensitive",
          },
        }
      : {}),
  };

  const subdistricts = await prisma.subdistricts.findMany({
    where,
    select: {
      subdistrict_code: true,
      subdistrict_name: true,
      district_code: true,
      districts: {
        select: {
          district_name: true,
          state_code: true,
          states: {
            select: {
              state_code: true,
              state_name: true,
            },
          },
        },
      },
    },
    orderBy: { subdistrict_name: "asc" },
  });

  // 3. Transform to include location hierarchy
  const transformedSubdistricts = subdistricts.map((subdistrict) => ({
    subdistrict_code: subdistrict.subdistrict_code,
    subdistrict_name: subdistrict.subdistrict_name,
    district_code: subdistrict.district_code,
    district_name: subdistrict.districts?.district_name || "",
    state_code: subdistrict.districts?.states?.state_code || "",
    state_name: subdistrict.districts?.states?.state_name || "",
  }));

  // 4. Store in cache (TTL = 1 hour)
  await redisClient.set(cacheKey, JSON.stringify(transformedSubdistricts), {
    EX: 3600,
  });

  return transformedSubdistricts;
};

const searchSubdistrictsByName = async (name) => {
  const normalizedName = typeof name === "string" ? name.trim() : "";

  if (!normalizedName) {
    return [];
  }

  const cacheKey = `subdistricts:search:${normalizedName.toLowerCase()}`;
  const cachedData = await redisClient.get(cacheKey);

  if (cachedData) {
    return JSON.parse(cachedData);
  }

  const subdistricts = await prisma.subdistricts.findMany({
    where: {
      subdistrict_name: {
        contains: normalizedName,
        mode: "insensitive",
      },
    },
    select: {
      subdistrict_code: true,
      subdistrict_name: true,
      district_code: true,
      districts: {
        select: {
          district_name: true,
          state_code: true,
          states: {
            select: {
              state_name: true,
            },
          },
        },
      },
    },
    orderBy: { subdistrict_name: "asc" },
    take: 20,
  });

  const transformedSubdistricts = subdistricts.map((subdistrict) => ({
    subdistrict_code: subdistrict.subdistrict_code,
    subdistrict_name: subdistrict.subdistrict_name,
    district_code: subdistrict.district_code,
    district_name: subdistrict.districts?.district_name || "",
    state_code: subdistrict.districts?.state_code || "",
    state_name: subdistrict.districts?.states?.state_name || "",
  }));

  await redisClient.set(cacheKey, JSON.stringify(transformedSubdistricts), {
    EX: 3600,
  });

  return transformedSubdistricts;
};

module.exports = { getSubdistrictsByDistrictId, searchSubdistrictsByName };
