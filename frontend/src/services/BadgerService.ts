import { API, Auth } from "aws-amplify";

const apiName = "BadgerApi";

async function authHeaders() {
  const token = await getAuthToken();
  return {
    Authorization: "Bearer ".concat(token),
  };
}

async function getAuthToken() {
  const session = await Auth.currentSession();
  const idToken = session.getIdToken();
  return idToken.getJwtToken();
}

async function fetchDashboards() {
  const headers = await authHeaders();
  return await API.get(apiName, "dashboard", { headers });
}

async function fetchDashboardById(dashboardId: string) {
  const headers = await authHeaders();
  return await API.get(apiName, `dashboard/${dashboardId}`, { headers });
}

async function fetchTopicAreas() {
  const headers = await authHeaders();
  return await API.get(apiName, "topicarea", { headers });
}

async function createDashboard(name: string, topicAreaId: string) {
  const headers = await authHeaders();
  return await API.post(apiName, "dashboard", {
    headers,
    body: {
      name,
      topicAreaId,
    }
  });
}

export default {
  fetchDashboards,
  fetchDashboardById,
  fetchTopicAreas,
  createDashboard,
  getAuthToken,
};
