import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Dashboard from "./components/Dashboard";
import VillageList from "./components/VillageList";
import {
  getDistricts,
  getStateVillageCounts,
  getStates,
  getSubdistricts,
  getVillages,
  searchDistricts,
  searchSubdistricts,
  searchVillages,
} from "./services/api";

function App() {
  const [villageSearch, setVillageSearch] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");
  const [subdistrictSearch, setSubdistrictSearch] = useState("");
  const [debouncedVillageSearch, setDebouncedVillageSearch] = useState("");
  const [debouncedDistrictSearch, setDebouncedDistrictSearch] = useState("");
  const [debouncedSubdistrictSearch, setDebouncedSubdistrictSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedSubdistrict, setSelectedSubdistrict] = useState("");

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedVillageSearch(villageSearch.trim());
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [villageSearch]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedDistrictSearch(districtSearch.trim());
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [districtSearch]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSubdistrictSearch(subdistrictSearch.trim());
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [subdistrictSearch]);

  const statesQuery = useQuery({
    queryKey: ["states"],
    queryFn: () => getStates(),
  });

  const stateVillageCountsQuery = useQuery({
    queryKey: ["state-village-counts"],
    queryFn: () => getStateVillageCounts(50),
  });

  const districtsQuery = useQuery({
    queryKey: ["districts", selectedState],
    queryFn: () => getDistricts(selectedState),
    enabled: !!selectedState,
  });

  const subdistrictsQuery = useQuery({
    queryKey: ["subdistricts", selectedDistrict],
    queryFn: () => getSubdistricts(selectedDistrict),
    enabled: !!selectedDistrict,
  });

  const villagesQuery = useQuery({
    queryKey: ["villages", selectedSubdistrict, page],
    queryFn: () => getVillages(selectedSubdistrict, page),
    enabled: !!selectedSubdistrict,
    placeholderData: keepPreviousData,
  });

  const villageSearchQuery = useQuery({
    queryKey: ["search-villages", debouncedVillageSearch],
    queryFn: () => searchVillages(debouncedVillageSearch),
    enabled: debouncedVillageSearch.length > 2,
  });

  const districtSearchQuery = useQuery({
    queryKey: ["search-districts", debouncedDistrictSearch],
    queryFn: () => searchDistricts(debouncedDistrictSearch),
    enabled: debouncedDistrictSearch.length > 2,
  });

  const subdistrictSearchQuery = useQuery({
    queryKey: ["search-subdistricts", debouncedSubdistrictSearch],
    queryFn: () => searchSubdistricts(debouncedSubdistrictSearch),
    enabled: debouncedSubdistrictSearch.length > 2,
  });

  const states = statesQuery.data ?? [];
  const districts = districtsQuery.data ?? [];
  const subdistricts = subdistrictsQuery.data ?? [];
  const villagesData = villagesQuery.data;
  const villages = villagesData?.data ?? [];
  const stateVillageCounts = stateVillageCountsQuery.data ?? [];
  const totalVillages = villagesData?.total ?? 0;
  const totalPages = villagesData?.totalPages ?? 1;
  const villageSearchResults = villageSearchQuery.data ?? [];
  const districtSearchResults = districtSearchQuery.data ?? [];
  const subdistrictSearchResults = subdistrictSearchQuery.data ?? [];

  const selectedStateLabel =
    states.find((state) => Number(state.state_code) === Number(selectedState))?.state_name ?? "";
  const selectedDistrictLabel =
    districts.find((district) => Number(district.district_code) === Number(selectedDistrict))?.district_name ?? "";
  const selectedSubdistrictLabel =
    subdistricts.find((subdistrict) => Number(subdistrict.subdistrict_code) === Number(selectedSubdistrict))
      ?.subdistrict_name ?? "";
  const selectedFlowText = [selectedStateLabel, selectedDistrictLabel, selectedSubdistrictLabel]
    .filter(Boolean)
    .join(" → ");

  const pageStart = totalVillages > 0 ? (page - 1) * 20 + 1 : 0;
  const pageEnd = totalVillages > 0 ? Math.min((page - 1) * 20 + villages.length, totalVillages) : 0;

  const errorMessage =
    statesQuery.error?.message ||
    stateVillageCountsQuery.error?.message ||
    districtsQuery.error?.message ||
    subdistrictsQuery.error?.message ||
    villagesQuery.error?.message ||
    villageSearchQuery.error?.message ||
    districtSearchQuery.error?.message ||
    subdistrictSearchQuery.error?.message ||
    "";

  const loadingStates = statesQuery.isLoading;
  const loadingDistricts = districtsQuery.isFetching;
  const loadingSubdistricts = subdistrictsQuery.isFetching;
  const noSubdistrictsAvailable = !!selectedDistrict && !loadingSubdistricts && subdistricts.length === 0;
  const loadingVillages = villagesQuery.isFetching;
  const villageSearchLoading = villageSearchQuery.isFetching;
  const districtSearchLoading = districtSearchQuery.isFetching;
  const subdistrictSearchLoading = subdistrictSearchQuery.isFetching;

  return (
    <div className="min-h-screen bg-gray-100 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">
                India Village Explorer
              </p>
              <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Explore states, districts, subdistricts, and villages
              </h1>
            </div>
          </div>
        </header>
        <Dashboard
          chartData={stateVillageCounts}
          chartLoading={stateVillageCountsQuery.isLoading}
        />
        <main className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-1 self-start rounded-3xl border border-slate-200 bg-white p-6 shadow-md hover:shadow-lg transition-all">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">Search places</h2>

            <div className="mt-5 space-y-5">
              <div>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">District name</span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                    <input
                      type="text"
                      placeholder="Search districts..."
                      value={districtSearch}
                      onChange={(event) => setDistrictSearch(event.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-11 py-3 text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                </label>

                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  {districtSearchLoading ? (
                    <p className="text-sm text-slate-600">Searching districts...</p>
                  ) : debouncedDistrictSearch.length > 2 ? (
                    districtSearchResults.length > 0 ? (
                      <ul className="max-h-40 space-y-2 overflow-y-auto pr-1">
                        {districtSearchResults.map((district) => (
                          <li
                            key={district.district_code}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 transition-all duration-200 hover:bg-slate-100"
                          >
                            <p className="font-semibold text-slate-900">{district.district_name}</p>
                            <p className="text-xs text-slate-600">{district.state_name || "—"}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-600">No results found for districts.</p>
                    )
                  ) : (
                    <p className="text-sm text-slate-600">Type a district name to search.</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Subdistrict name</span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                    <input
                      type="text"
                      placeholder="Search subdistricts..."
                      value={subdistrictSearch}
                      onChange={(event) => setSubdistrictSearch(event.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-11 py-3 text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                </label>

                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  {subdistrictSearchLoading ? (
                    <p className="text-sm text-slate-600">Searching subdistricts...</p>
                  ) : debouncedSubdistrictSearch.length > 2 ? (
                    subdistrictSearchResults.length > 0 ? (
                      <ul className="max-h-40 space-y-2 overflow-y-auto pr-1">
                        {subdistrictSearchResults.map((subdistrict) => (
                          <li
                            key={subdistrict.subdistrict_code}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 transition-all duration-200 hover:bg-slate-100"
                          >
                            <p className="font-semibold text-slate-900">{subdistrict.subdistrict_name}</p>
                            <p className="text-xs text-slate-600">
                              {subdistrict.state_name || "—"} → {subdistrict.district_name || "—"}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-600">No results found for subdistricts.</p>
                    )
                  ) : (
                    <p className="text-sm text-slate-600">Type a subdistrict name to search.</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Village name</span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                    <input
                      type="text"
                      placeholder="Search villages..."
                      value={villageSearch}
                      onChange={(event) => setVillageSearch(event.target.value)}
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-11 py-3 text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                </label>

                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  {villageSearchLoading ? (
                    <p className="text-sm text-slate-600">Searching villages...</p>
                  ) : debouncedVillageSearch.length > 2 ? (
                    villageSearchResults.length > 0 ? (
                      <ul className="max-h-48 space-y-2 overflow-y-auto pr-1">
                        {villageSearchResults.map((village) => {
                          const villageCode = village.village_code ?? village.code;
                          const villageName = village.village_name ?? village.name;
                          const stateName = village.state_name ?? "—";
                          const districtName = village.district_name ?? "—";
                          const subdistrictName = village.subdistrict_name ?? "—";

                          return (
                            <li
                              key={villageCode}
                              className="rounded-xl border border-slate-200 bg-white p-3 transition-all duration-200 hover:bg-slate-100"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-slate-900">{villageName}</p>
                                  <p className="mt-1 text-xs text-slate-600">
                                    {stateName} → {districtName} → {subdistrictName}
                                  </p>
                                </div>
                                <span className="text-sm font-medium text-slate-500">{villageCode}</span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-600">No results found for villages.</p>
                    )
                  ) : (
                    <p className="text-sm text-slate-600">Type a village name to search.</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="lg:col-span-2 flex flex-col gap-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md hover:shadow-lg transition-all">
              <div className="mb-5">
                <h2 className="text-2xl font-bold tracking-tight text-slate-950">Location picker</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Select a state, then district, then subdistrict to load the villages list.
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {selectedFlowText || "No location selected yet"}
                </p>
              </div>

              {errorMessage ? (
                <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {errorMessage}
                </div>
              ) : null}

              <div className="grid gap-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">State</span>
                  <select
                    value={selectedState}
                    onChange={(event) => {
                      setPage(1);
                      setSelectedState(event.target.value);
                      setSelectedDistrict("");
                      setSelectedSubdistrict("");
                    }}
                    disabled={loadingStates}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">{loadingStates ? "Loading states..." : "Select State"}</option>
                    {states.map((state) => (
                      <option key={state.state_code} value={state.state_code}>
                        {state.state_name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">District</span>
                  <select
                    value={selectedDistrict}
                    onChange={(event) => {
                      setPage(1);
                      setSelectedDistrict(event.target.value);
                      setSelectedSubdistrict("");
                    }}
                    disabled={!selectedState || loadingDistricts}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">
                      {!selectedState ? "Select state first" : loadingDistricts ? "Loading districts..." : "Select District"}
                    </option>
                    {districts.map((district) => (
                      <option key={district.district_code} value={district.district_code}>
                        {district.district_name} ({district.state_name || "—"})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Subdistrict</span>
                  <select
                    value={selectedSubdistrict}
                    onChange={(event) => {
                      setPage(1);
                      setSelectedSubdistrict(event.target.value);
                    }}
                    disabled={!selectedDistrict || loadingSubdistricts}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">
                      {!selectedDistrict
                        ? "Select district first"
                        : loadingSubdistricts
                          ? "Loading subdistricts..."
                          : noSubdistrictsAvailable
                            ? "No subdistricts available"
                            : "Select Subdistrict"}
                    </option>
                    {subdistricts.map((subdistrict) => (
                      <option key={subdistrict.subdistrict_code} value={subdistrict.subdistrict_code}>
                        {subdistrict.subdistrict_name} ({subdistrict.district_name || "—"} → {subdistrict.state_name || "—"})
                      </option>
                    ))}
                  </select>
                  {noSubdistrictsAvailable ? (
                    <p className="mt-2 text-xs text-amber-700">
                      No subdistrict data is available for this district. Please choose another district.
                    </p>
                  ) : null}
                </label>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-gray-50 p-6 shadow-md hover:shadow-lg transition-all">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-3xl font-bold tracking-tight text-slate-950">Villages</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Showing {pageStart}-{pageEnd} of {totalVillages} villages
                </span>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <VillageList
                  villages={villages}
                  loading={loadingVillages}
                  emptyMessage={
                    selectedSubdistrict
                      ? "No villages found on this page."
                      : noSubdistrictsAvailable
                        ? "Choose a different district that has subdistrict data."
                        : "Please select a subdistrict to load villages."
                  }
                />
              </div>

              <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-200 pt-5">
                <button
                  onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 1))}
                  disabled={page === 1 || loadingVillages}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Prev
                </button>

                <span className="text-sm font-semibold text-slate-600">
                  Page {page} of {totalPages}
                </span>

                <button
                  onClick={() => setPage((currentPage) => Math.min(currentPage + 1, totalPages))}
                  disabled={page === totalPages || loadingVillages}
                  className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
