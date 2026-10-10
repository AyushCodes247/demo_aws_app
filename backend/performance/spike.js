import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:4000";
const USERS_URL = `${BASE_URL}/api/v1/users`;
const TODOS_URL = `${BASE_URL}/api/v1/todos`;

const USERS = [
  { email: "Ayush@gmail.com", password: "ayush1234" },
  { email: "Piyus@gmail.com", password: "piyush1234" },
  { email: "Iyus@gmail.com", password: "Iyush1234" },
  { email: "yus@gmail.com", password: "yush1234" },
  { email: "palak@gmail.com", password: "palak1234" },
  { email: "alak@gmail.com", password: "alak1234" },
  { email: "alakh@gmail.com", password: "alakh1234" },
  { email: "alaka@gmail.com", password: "alaka1234" },
  { email: "alka@gmail.com", password: "alka1234" },
  { email: "alaya@gmail.com", password: "alaya1234" },
];

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

export const options = {
  scenarios: {
    authenticated_spike_test: {
      executor: "ramping-vus",
      startVUs: 1,
      stages: [
        { duration: "30s", target: 2 },
        { duration: "5s", target: 10 },
        { duration: "1m", target: 10 },
        { duration: "5s", target: 0 },
        { duration: "30s", target: 0 },
      ],
      gracefulRampDown: "10s",
      exec: "spikeWorkflow",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<1500", "p(99)<3000"],
    checks: ["rate>0.95"],
  },
};

const getUser = () => USERS[(__VU - 1) % USERS.length];

const readJson = (response) => {
  try {
    return response.json();
  } catch {
    return null;
  }
};

const getAccessToken = (response) => {
  const body = readJson(response);

  return (
    body?.accessToken ??
    body?.data?.accessToken ??
    body?.tokens?.accessToken ??
    body?.token ??
    body?.data?.token ??
    null
  );
};

const getTodoId = (body) =>
  body?.todoId ??
  body?.data?.todoId ??
  body?.data?._id ??
  body?._id ??
  body?.data?.id ??
  body?.id ??
  body?.todo?._id ??
  body?.todo?.id ??
  body?.data?.todo?._id ??
  body?.data?.todo?.id ??
  null;

const authParams = (token) => ({
  headers: {
    ...JSON_HEADERS,
    Authorization: `Bearer ${token}`,
  },
});

const checkStatus = (name, response, expectedStatus) => {
  const passed = check(response, {
    [`${name}: status ${expectedStatus}`]: (res) =>
      res.status === expectedStatus,
  });

  if (!passed) {
    console.error(
      `${name}: expected=${expectedStatus}, actual=${response.status}, body=${response.body?.substring(0, 250)}`,
    );
  }

  return passed;
};

export function spikeWorkflow() {
  const user = getUser();

  const login = http.post(
    `${USERS_URL}/login`,
    JSON.stringify({
      email: user.email,
      password: user.password,
    }),
    { headers: JSON_HEADERS },
  );

  if (!checkStatus("login", login, 200)) {
    sleep(1);
    return;
  }

  const token = getAccessToken(login);

  if (!token) {
    console.error(`Access token missing for ${user.email}`);
    sleep(1);
    return;
  }

  const params = authParams(token);
  const uniqueId = `${__VU}-${__ITER}-${Date.now()}`;

  const profile = http.get(`${USERS_URL}/profile`, params);
  checkStatus("profile", profile, 200);

  const createTodo = http.post(
    TODOS_URL,
    JSON.stringify({
      topicName: `Spike Test Todo ${uniqueId}`,
      description: `Created during spike test for ${user.email}`,
    }),
    params,
  );

  if (!checkStatus("create todo", createTodo, 201)) {
    sleep(1);
    return;
  }

  const todoId = getTodoId(readJson(createTodo));

  if (!todoId) {
    console.error(
      `Todo ID missing for ${user.email}. Create response: ${createTodo.body?.substring(0, 500)}`,
    );
    sleep(1);
    return;
  }

  const listTodos = http.get(TODOS_URL, params);
  checkStatus("list todos", listTodos, 200);

  const stats = http.get(`${TODOS_URL}/stats`, params);
  checkStatus("todo stats", stats, 200);

  const getTodo = http.get(`${TODOS_URL}/${todoId}`, params);
  checkStatus("get todo", getTodo, 200);

  const updateTodo = http.patch(
    `${TODOS_URL}/${todoId}`,
    JSON.stringify({
      topicName: `Updated Spike Todo ${uniqueId}`,
      description: `Updated during spike test for ${user.email}`,
    }),
    params,
  );
  checkStatus("update todo", updateTodo, 200);

  const updateStatus = http.patch(
    `${TODOS_URL}/${todoId}/status`,
    JSON.stringify({
      status: "Completed",
    }),
    params,
  );
  checkStatus("update todo status", updateStatus, 200);

  const deleteTodo = http.del(`${TODOS_URL}/${todoId}/delete`, null, params);
  checkStatus("delete todo", deleteTodo, 200);

  const logout = http.post(`${USERS_URL}/logout`, null, params);
  checkStatus("logout", logout, 200);

  sleep(1);
}
