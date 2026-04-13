const BASE_URL = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_API_KEY ?? "";

const buildHeaders = () => {
	const headers = {
		"Content-Type": "application/json",
	};

	  if (API_KEY.trim()) {
		headers["x-api-key"] = API_KEY;
	}

	return headers;
};

const fetchJson = async (path) => {
	const response = await fetch(`${BASE_URL}${path}`, {
		headers: buildHeaders(),
	});

	if (!response.ok) {
		const contentType = response.headers.get("content-type") || "";

		if (contentType.includes("application/json")) {
			const payload = await response.json();
			throw new Error(payload.error || `Request failed with status ${response.status}`);
		}

		const message = await response.text();
		throw new Error(message || `Request failed with status ${response.status}`);
	}

	return response.json();
};

export const getStates = (name = "") => {
	const search = new URLSearchParams();

	if (name.trim()) {
		search.set("name", name.trim());
	}

	const query = search.toString();
	return fetchJson(`/states${query ? `?${query}` : ""}`);
};

export const getDistricts = (stateCode, name = "") => {
	const search = new URLSearchParams();

	if (name.trim()) {
		search.set("name", name.trim());
	}

	const query = search.toString();
	return fetchJson(`/states/${stateCode}/districts${query ? `?${query}` : ""}`);
};

export const getSubdistricts = (districtCode, name = "") => {
	const search = new URLSearchParams();

	if (name.trim()) {
		search.set("name", name.trim());
	}

	const query = search.toString();
	return fetchJson(`/districts/${districtCode}/subdistricts${query ? `?${query}` : ""}`);
};

export const getVillages = (subdistrictCode, page = 1, limit = 20, name = "") => {
	const search = new URLSearchParams({
		subdistrict_code: String(subdistrictCode),
		page: String(page),
		limit: String(limit),
	});

	if (name.trim()) {
		search.set("name", name.trim());
	}

	return fetchJson(`/villages?${search.toString()}`);
};

export const searchVillages = (query) => {
	const normalizedQuery = query.trim();
	return fetchJson(`/villages/search?name=${encodeURIComponent(normalizedQuery)}`);
};

export const searchDistricts = (query) => {
	const normalizedQuery = query.trim();
	return fetchJson(`/districts/search?name=${encodeURIComponent(normalizedQuery)}`);
};

export const searchSubdistricts = (query) => {
	const normalizedQuery = query.trim();
	return fetchJson(`/subdistricts/search?name=${encodeURIComponent(normalizedQuery)}`);
};
