const prisma = require("../prisma/client");
const redisClient = require("../config/redis");

const getVillagesBySubdistrictId = async (subdistrictId, page, limit, name) => {
  const cacheKey = name 
    ? `villages:${subdistrictId}:${name}:p${page}:l${limit}` 
    : `villages:${subdistrictId}:p${page}:l${limit}`;

  // 1. Check cache
  const cachedData = await redisClient.get(cacheKey);
  if (cachedData) {
    return JSON.parse(cachedData);
  }

  // 2. Fetch from DB
  const where = {
    subdistrict_code: subdistrictId,
    ...(name
      ? {
          village_name: {
            contains: name,
            mode: "insensitive",
          },
        }
      : {}),
  };

  const villages = await prisma.villages.findMany({
    where,
    select: {
      village_code: true,
      village_name: true,
    },
    orderBy: { village_name: "asc" },
    skip: (page - 1) * limit,
    take: limit,
  });

  // 3. Store in cache (TTL = 1 hour)
  await redisClient.set(cacheKey, JSON.stringify(villages), {
    EX: 3600,
  });

  return villages;
};

const getVillagesPage = async (subdistrictCode, page = 1, limit = 20) => {
  const normalizedPage = Math.max(Number(page) || 1, 1);
  const normalizedLimit = Math.max(Number(limit) || 20, 1);
  const cacheKey = `villages:page:${subdistrictCode}:p${normalizedPage}:l${normalizedLimit}`;

  const cachedData = await redisClient.get(cacheKey);
  if (cachedData) {
    return JSON.parse(cachedData);
  }

  const where = {
    subdistrict_code: subdistrictCode,
  };

  const [villages, total] = await Promise.all([
    prisma.villages.findMany({
      where,
      select: {
        village_code: true,
        village_name: true,
      },
      orderBy: { village_name: "asc" },
      skip: (normalizedPage - 1) * normalizedLimit,
      take: normalizedLimit,
    }),
    prisma.villages.count({
      where,
    }),
  ]);

  const payload = {
    data: villages,
    total,
    page: normalizedPage,
    totalPages: Math.max(Math.ceil(total / normalizedLimit), 1),
  };

  await redisClient.set(cacheKey, JSON.stringify(payload), {
    EX: 3600,
  });

  return payload;
};

const searchVillagesByName = async (name) => {
  const normalizedName = typeof name === "string" ? name.trim() : "";

  if (!normalizedName) {
    return [];
  }

  const cacheKey = `villages:search:${normalizedName.toLowerCase()}`;
  
  // First, get the village IDs that match
  const villageMatches = await prisma.villages.findMany({
    where: {
      village_name: {
        contains: normalizedName,
        mode: "insensitive",
      },
    },
    select: {
      village_code: true,
      village_name: true,
      district_code: true,
      subdistrict_code: true,
    },
    orderBy: { village_name: "asc" },
    take: 20,
  });

  // Then, for each village, get the location info
  const transformedVillages = await Promise.all(
    villageMatches.map(async (village) => {
      const district = await prisma.districts.findUniqueOrThrow({
        where: { district_code: village.district_code },
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
      }).catch(() => null);

      const subdistrict = await prisma.subdistricts.findUniqueOrThrow({
        where: { subdistrict_code: village.subdistrict_code },
        select: { subdistrict_name: true },
      }).catch(() => null);

      return {
        village_code: village.village_code,
        village_name: village.village_name,
        subdistrict_code: village.subdistrict_code,
        subdistrict_name: subdistrict?.subdistrict_name || "—",
        district_code: village.district_code,
        district_name: district?.district_name || "—",
        state_code: district?.states?.state_code || "—",
        state_name: district?.states?.state_name || "—",
      };
    })
  );

  await redisClient.set(cacheKey, JSON.stringify(transformedVillages), {
    EX: 3600,
  });

  return transformedVillages;
};

module.exports = { getVillagesBySubdistrictId, getVillagesPage, searchVillagesByName };
