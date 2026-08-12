import axios from "axios";

const isLocal =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.startsWith("192.168.") ||
    window.location.hostname.startsWith("10.") ||
    window.location.hostname.startsWith("172."));

const BASE = isLocal
  ? `http://${window.location.hostname}:8000`
  : "https://admin-aged-field-2794.fly.dev";

const authHeader = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

// Auth
export const mgmtLogin = (data) =>
  axios.post(`${BASE}/management/auth/login`, data).then((r) => r.data);

// Dropdowns
export const getIncomeSources = (token) =>
  axios.get(`${BASE}/management/income-sources`, authHeader(token)).then((r) => r.data);
export const addIncomeSource = (token, data) =>
  axios.post(`${BASE}/management/income-sources`, data, authHeader(token)).then((r) => r.data);
export const deleteIncomeSource = (token, id) =>
  axios.delete(`${BASE}/management/income-sources/${id}`, authHeader(token));

export const getOutgoDestinations = (token) =>
  axios.get(`${BASE}/management/outgo-destinations`, authHeader(token)).then((r) => r.data);
export const addOutgoDestination = (token, data) =>
  axios.post(`${BASE}/management/outgo-destinations`, data, authHeader(token)).then((r) => r.data);
export const deleteOutgoDestination = (token, id) =>
  axios.delete(`${BASE}/management/outgo-destinations/${id}`, authHeader(token));

// Income entries
export const getIncomeEntries = (token) =>
  axios.get(`${BASE}/management/income`, authHeader(token)).then((r) => r.data);
export const createIncomeEntry = (token, data) =>
  axios.post(`${BASE}/management/income`, data, authHeader(token)).then((r) => r.data);
export const deleteIncomeEntry = (token, id) =>
  axios.delete(`${BASE}/management/income/${id}`, authHeader(token));

// Outgo entries
export const getOutgoEntries = (token) =>
  axios.get(`${BASE}/management/outgo`, authHeader(token)).then((r) => r.data);
export const createOutgoEntry = (token, data) =>
  axios.post(`${BASE}/management/outgo`, data, authHeader(token)).then((r) => r.data);
export const deleteOutgoEntry = (token, id) =>
  axios.delete(`${BASE}/management/outgo/${id}`, authHeader(token));

// Reports
export const getDashboard = (token, start, end) => {
  const params = new URLSearchParams();
  if (start) params.append("start", start);
  if (end) params.append("end", end);
  return axios
    .get(`${BASE}/management/reports/dashboard?${params}`, authHeader(token))
    .then((r) => r.data);
};

export const getLedger = (token, start, end) => {
  const params = new URLSearchParams();
  if (start) params.append("start", start);
  if (end) params.append("end", end);
  return axios
    .get(`${BASE}/management/reports/ledger?${params}`, authHeader(token))
    .then((r) => r.data);
};
