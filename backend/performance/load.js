
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
    user_todo_workflow: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 5 },
        { duration: "1m", target: 10 },
        { duration: "30s", target: 0 },
      ],
      exec: "userTodoWorkflow",
    },
    registration_load: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "15s", target: 2 },
        { duration: "30s", target: 5 },
        { duration: "15s", target: 0 },
      ],
      startTime: "2m15s",
      exec: "registrationLoad",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<800", "p(99)<1500"],
    checks: ["rate>0.99"],
  },
};

const getUser = () => USERS[(__VU - 1) % USERS.length];

const requestParams = (token) => ({
  headers: {
    ...JSON_HEADERS,
    Authorization: `Bearer ${token}`,
  },
});

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

const checkResponse = (name, response, expectedStatus, includeBody = true) => {
  const passed = check(response, {
    [`${name}: status is ${expectedStatus}`]: (res) =>
      res.status === expectedStatus,
  });

  if (!passed && includeBody) {
    console.error(
      `${name} failed: expected=${expectedStatus}, actual=${response.status}, body=${response.body?.substring(0, 300)}`,
    );
  }

  return passed;
};

export function userTodoWorkflow() {
  const user = getUser();

  const login = http.post(
    `${USERS_URL}/login`,
    JSON.stringify({
      email: user.email,
      password: user.password,
    }),
    { headers: JSON_HEADERS },
  );

  if (!checkResponse("login", login, 200)) {
    sleep(1);
    return;
  }

  const token = getAccessToken(login);

  if (!token) {
    console.error(`Access token missing for ${user.email}`);
    sleep(1);
    return;
  }

  const authParams = requestParams(token);

  const profile = http.get(`${USERS_URL}/profile`, authParams);
  checkResponse("profile", profile, 200);

  const uniqueId = `${__VU}-${__ITER}-${Date.now()}`;

  const createTodo = http.post(
    TODOS_URL,
    JSON.stringify({
      topicName: `Load Test Todo ${uniqueId}`,
      description: `Todo created by k6 for ${user.email}`,
    }),
    authParams,
  );

  if (!checkResponse("create todo", createTodo, 201)) {
    sleep(1);
    return;
  }

  const createdTodo = readJson(createTodo);
  const todoId =
    createdTodo?.todoId ??
    createdTodo?.data?.todoId ??
    createdTodo?.data?._id ??
    createdTodo?._id ??
    createdTodo?.data?.id ??
    createdTodo?.id;

  const listTodos = http.get(TODOS_URL, authParams);
  checkResponse("list todos", listTodos, 200);

  const stats = http.get(`${TODOS_URL}/stats`, authParams);
  checkResponse("todo stats", stats, 200);

  if (todoId) {
    const getTodo = http.get(`${TODOS_URL}/${todoId}`, authParams);
    checkResponse("get todo", getTodo, 200);

    const updateTodo = http.patch(
      `${TODOS_URL}/${todoId}`,
      JSON.stringify({
        topicName: `Updated Load Test Todo ${uniqueId}`,
        description: `Updated description for ${user.email}`,
      }),
      authParams,
    );
    checkResponse("update todo", updateTodo, 200);

    const updateStatus = http.patch(
      `${TODOS_URL}/${todoId}/status`,
      JSON.stringify({
        status: "Completed",
      }),
      authParams,
    );
    checkResponse("update todo status", updateStatus, 200);

    const deleteTodo = http.del(
      `${TODOS_URL}/${todoId}/delete`,
      null,
      authParams,
    );
    checkResponse("delete todo", deleteTodo, 200);
  } else {
    console.error(
      `Todo ID missing for ${user.email}: ${createTodo.body?.substring(0, 300)}`,
    );
  }

  const logout = http.post(`${USERS_URL}/logout`, null, authParams);
  checkResponse("logout", logout, 200);

  sleep(1);
}

export function registrationLoad() {
  const uniqueId = `${Date.now()}-${__VU}-${__ITER}`;
  const email = `k6-${uniqueId}@example.com`;
  const username = `k6user${uniqueId}`.replace(/[^a-zA-Z0-9_-]/g, "");

  const response = http.post(
    `${USERS_URL}/register`,
    JSON.stringify({
      username,
      email,
      password: `LoadTest-${uniqueId}-Aa1!`,
    }),
    { headers: JSON_HEADERS },
  );

  checkResponse("registration", response, 201);
  sleep(1);
}
