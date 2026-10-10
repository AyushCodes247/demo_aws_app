import { describe, it, expect } from "@jest/globals";
import request from "supertest";
import app from "../app.js";
import {
  baseUri,
  makeUser,
  getAccessToken,
  getRefreshCookie,
  expectSafeUser,
  registerUser,
  loginUser,
} from "./helpers/user.js";

describe("POST /register", () => {
  it("registers a user and returns the expected response", async () => {
    const user = makeUser();

    const response = await request(app).post(`${baseUri}/register`).send(user);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      message: "User registered successfully.",
    });

    expectSafeUser(response.body.user, user);
    expect(getAccessToken(response)).toEqual(expect.any(String));
    expect(getAccessToken(response).length).toBeGreaterThan(0);
    expect(getRefreshCookie(response)).toBeDefined();
  });

  it("rejects an existing email", async () => {
    const user = makeUser();

    const first = await request(app).post(`${baseUri}/register`).send(user);

    expect(first.status).toBe(201);

    const second = await request(app)
      .post(`${baseUri}/register`)
      .send({
        ...user,
        username: `${user.username}_other`,
      });

    expect(second.status).toBe(409);
    expect(second.body.success).toBe(false);
  });

  it.each([
    ["empty body", {}],
    [
      "missing username",
      { email: "test@example.com", password: "StrongPass123!" },
    ],
    ["missing email", { username: "test_user", password: "StrongPass123!" }],
    ["missing password", { username: "test_user", email: "test@example.com" }],
    [
      "null username",
      { username: null, email: "test@example.com", password: "StrongPass123!" },
    ],
    [
      "null email",
      { username: "test_user", email: null, password: "StrongPass123!" },
    ],
    [
      "null password",
      { username: "test_user", email: "test@example.com", password: null },
    ],
    [
      "empty username",
      { username: "", email: "test@example.com", password: "StrongPass123!" },
    ],
    [
      "whitespace username",
      {
        username: "   ",
        email: "test@example.com",
        password: "StrongPass123!",
      },
    ],
    [
      "empty email",
      { username: "test_user", email: "", password: "StrongPass123!" },
    ],
    [
      "invalid email",
      { username: "test_user", email: "invalid", password: "StrongPass123!" },
    ],
    [
      "empty password",
      { username: "test_user", email: "test@example.com", password: "" },
    ],
    ["wrong field types", { username: 123, email: true, password: {} }],
  ])("rejects invalid registration: %s", async (_case, body) => {
    const response = await request(app).post(`${baseUri}/register`).send(body);

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
    expect(response.body.success).toBe(false);
  });

  it("does not expose password or password hash", async () => {
    const user = makeUser();

    const response = await request(app).post(`${baseUri}/register`).send(user);

    expect(response.status).toBe(201);
    expect(response.body.user.password).toBeUndefined();
    expect(response.body.user.passwordHash).toBeUndefined();
    expect(JSON.stringify(response.body)).not.toContain(user.password);
  });

  it("rejects concurrent registrations for the same email", async () => {
    const user = makeUser();

    const responses = await Promise.all(
      Array.from({ length: 10 }, () =>
        request(app).post(`${baseUri}/register`).send(user),
      ),
    );

    expect(
      responses.filter((response) => response.status === 201),
    ).toHaveLength(1);

    expect(
      responses.every((response) => [201, 409].includes(response.status)),
    ).toBe(true);
  });

  it("allows two different users to register concurrently", async () => {
    const firstUser = makeUser();
    const secondUser = makeUser();

    const [first, second] = await Promise.all([
      request(app).post(`${baseUri}/register`).send(firstUser),
      request(app).post(`${baseUri}/register`).send(secondUser),
    ]);

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(first.body.user.publicId).not.toBe(second.body.user.publicId);
  });

  it("does not return an access token or refresh cookie on duplicate registration", async () => {
    const user = makeUser();

    await request(app).post(`${baseUri}/register`).send(user);

    const duplicate = await request(app).post(`${baseUri}/register`).send(user);

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.accessToken).toBeUndefined();
    expect(getRefreshCookie(duplicate)).toBeUndefined();
  });
});

describe("POST /login", () => {
  it("logs in a registered user", async () => {
    const user = makeUser();
    const registration = await registerUser(user);

    expect(registration.response.status).toBe(201);

    const response = await request(app).post(`${baseUri}/login`).send({
      email: user.email,
      password: user.password,
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("User logged in successfully.");
    expectSafeUser(response.body.user, user);
    expect(getAccessToken(response).length).toBeGreaterThan(0);
    expect(getRefreshCookie(response)).toBeDefined();
    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it("rejects an incorrect password", async () => {
    const user = makeUser();
    await registerUser(user);

    const response = await request(app).post(`${baseUri}/login`).send({
      email: user.email,
      password: "IncorrectPass123!",
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("rejects an unknown email", async () => {
    const response = await request(app).post(`${baseUri}/login`).send({
      email: makeUser().email,
      password: "StrongPass123!",
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it.each([
    ["empty body", {}],
    ["missing email", { password: "StrongPass123!" }],
    ["missing password", { email: "test@example.com" }],
    ["empty email", { email: "", password: "StrongPass123!" }],
    ["empty password", { email: "test@example.com", password: "" }],
    ["null email", { email: null, password: "StrongPass123!" }],
    ["null password", { email: "test@example.com", password: null }],
    ["wrong types", { email: 123, password: {} }],
  ])("rejects invalid login input: %s", async (_case, body) => {
    const response = await request(app).post(`${baseUri}/login`).send(body);

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
    expect(response.body.success).toBe(false);
  });

  it("uses a generic error for unknown email and incorrect password", async () => {
    const user = makeUser();
    await registerUser(user);

    const [wrongPassword, unknownEmail] = await Promise.all([
      request(app)
        .post(`${baseUri}/login`)
        .send({ email: user.email, password: "WrongPass123!" }),
      request(app)
        .post(`${baseUri}/login`)
        .send({ email: makeUser().email, password: user.password }),
    ]);

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
  });

  it("does not return the submitted password or password hash", async () => {
    const user = makeUser();
    await registerUser(user);

    const response = await request(app).post(`${baseUri}/login`).send({
      email: user.email,
      password: user.password,
    });

    expect(response.status).toBe(200);
    expect(response.body.user.password).toBeUndefined();
    expect(response.body.user.passwordHash).toBeUndefined();
    expect(JSON.stringify(response.body)).not.toContain(user.password);
  });

  it("handles concurrent valid login requests", async () => {
    const user = makeUser();
    await registerUser(user);

    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        request(app).post(`${baseUri}/login`).send({
          email: user.email,
          password: user.password,
        }),
      ),
    );

    for (const response of responses) {
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(getAccessToken(response).length).toBeGreaterThan(0);
      expect(getRefreshCookie(response)).toBeDefined();
    }
  });

  it("does not create a successful response for incorrect credentials", async () => {
    const user = makeUser();
    await registerUser(user);

    const response = await request(app).post(`${baseUri}/login`).send({
      email: user.email,
      password: "WrongPass123!",
    });

    expect(response.status).toBe(401);
    expect(response.body.accessToken).toBeUndefined();
    expect(getRefreshCookie(response)).toBeUndefined();
  });
});

describe("GET /profile", () => {
  it("returns the authenticated user's profile", async () => {
    const user = makeUser();
    await registerUser(user);

    const login = await loginUser(user);
    expect(login.status).toBe(200);

    const token = getAccessToken(login);

    const response = await request(app)
      .get(`${baseUri}/profile`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("profile fetched successfully.");
    expectSafeUser(response.body.user, user);
  });

  it.each([
    ["missing header", undefined],
    ["empty header", ""],
    ["wrong scheme", "Basic abc123"],
    ["missing token", "Bearer"],
    ["invalid token", "Bearer invalid.token.value"],
    ["malformed token", "Bearer not-a-jwt"],
  ])("rejects %s", async (_case, authorization) => {
    let testRequest = request(app).get(`${baseUri}/profile`);

    if (authorization !== undefined) {
      testRequest = testRequest.set("Authorization", authorization);
    }

    const response = await testRequest;

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("rejects a token after logout", async () => {
    const user = makeUser();
    await registerUser(user);

    const login = await loginUser(user);
    const token = getAccessToken(login);

    expect(token).toBeTruthy();

    const logout = await request(app)
      .post(`${baseUri}/logout`)
      .set("Authorization", `Bearer ${token}`);

    expect(logout.status).toBe(200);

    const profile = await request(app)
      .get(`${baseUri}/profile`)
      .set("Authorization", `Bearer ${token}`);

    expect(profile.status).toBe(401);
  });

  it("returns only the universal public user fields", async () => {
    const user = makeUser();
    await registerUser(user);

    const login = await loginUser(user);
    const response = await request(app)
      .get(`${baseUri}/profile`)
      .set("Authorization", `Bearer ${getAccessToken(login)}`);

    expect(response.status).toBe(200);
    expect(Object.keys(response.body.user).sort()).toEqual(
      ["createdAt", "email", "publicId", "username"].sort(),
    );
  });

  it("handles concurrent authenticated profile requests", async () => {
    const user = makeUser();
    await registerUser(user);

    const login = await loginUser(user);
    const token = getAccessToken(login);

    const responses = await Promise.all(
      Array.from({ length: 10 }, () =>
        request(app)
          .get(`${baseUri}/profile`)
          .set("Authorization", `Bearer ${token}`),
      ),
    );

    for (const response of responses) {
      expect(response.status).toBe(200);
      expectSafeUser(response.body.user, user);
    }
  });
});

describe("POST /logout", () => {
  it("logs out an authenticated user", async () => {
    const user = makeUser();
    await registerUser(user);

    const login = await loginUser(user);
    const token = getAccessToken(login);

    const response = await request(app)
      .post(`${baseUri}/logout`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: "logged out successfully.",
    });
  });

  it("rejects logout without an access token", async () => {
    const response = await request(app).post(`${baseUri}/logout`);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("rejects logout with an invalid token", async () => {
    const response = await request(app)
      .post(`${baseUri}/logout`)
      .set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("invalidates the old access token after logout", async () => {
    const user = makeUser();
    await registerUser(user);

    const login = await loginUser(user);
    const token = getAccessToken(login);

    const logout = await request(app)
      .post(`${baseUri}/logout`)
      .set("Authorization", `Bearer ${token}`);

    expect(logout.status).toBe(200);

    const profile = await request(app)
      .get(`${baseUri}/profile`)
      .set("Authorization", `Bearer ${token}`);

    expect(profile.status).toBe(401);
  });

  it("handles repeated logout requests safely", async () => {
    const user = makeUser();
    await registerUser(user);

    const login = await loginUser(user);
    const token = getAccessToken(login);

    const firstLogout = await request(app)
      .post(`${baseUri}/logout`)
      .set("Authorization", `Bearer ${token}`);

    expect(firstLogout.status).toBe(200);

    const secondLogout = await request(app)
      .post(`${baseUri}/logout`)
      .set("Authorization", `Bearer ${token}`);

    expect(secondLogout.status).toBe(401);
  });

  it("handles concurrent logout requests without restoring the session", async () => {
    const user = makeUser();
    await registerUser(user);

    const login = await loginUser(user);
    const token = getAccessToken(login);

    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        request(app)
          .post(`${baseUri}/logout`)
          .set("Authorization", `Bearer ${token}`),
      ),
    );

    expect(
      responses.every((response) => [200, 401].includes(response.status)),
    ).toBe(true);

    const profile = await request(app)
      .get(`${baseUri}/profile`)
      .set("Authorization", `Bearer ${token}`);

    expect(profile.status).toBe(401);
  });

  it("does not accept the old token after a later login", async () => {
    const user = makeUser();
    await registerUser(user);

    const firstLogin = await loginUser(user);
    const oldToken = getAccessToken(firstLogin);

    const logout = await request(app)
      .post(`${baseUri}/logout`)
      .set("Authorization", `Bearer ${oldToken}`);

    expect(logout.status).toBe(200);

    const secondLogin = await loginUser(user);
    expect(secondLogin.status).toBe(200);

    const oldTokenProfile = await request(app)
      .get(`${baseUri}/profile`)
      .set("Authorization", `Bearer ${oldToken}`);

    expect(oldTokenProfile.status).toBe(401);

    const newTokenProfile = await request(app)
      .get(`${baseUri}/profile`)
      .set("Authorization", `Bearer ${getAccessToken(secondLogin)}`);

    expect(newTokenProfile.status).toBe(200);
  });
});
