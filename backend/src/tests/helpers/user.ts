import { expect } from "@jest/globals";
import request from "supertest";
import app from "@/app.js";

export const baseUri = "/api/v1/users";

export const makeUser = () => {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  return {
    username: `user_${id}`,
    email: `user_${id}@example.com`,
    password: "StrongPass123!",
  };
};

export const registerUser = async (user = makeUser()) => {
  const response = await request(app).post(`${baseUri}/register`).send(user);

  return { user, response };
};

export const loginUser = async (user: ReturnType<typeof makeUser>) => {
  return request(app).post(`${baseUri}/login`).send({
    email: user.email,
    password: user.password,
  });
};

export const getAccessToken = (response: { body: { accessToken?: string } }) =>
  response.body.accessToken ?? "";

export const getRefreshCookie = (response: {
  headers: Record<string, unknown>;
}) => {
  const cookies = response.headers["set-cookie"];

  if (!Array.isArray(cookies)) return undefined;

  return cookies.find((cookie: string) => cookie.startsWith("todo_cookie="));
};

export const expectSafeUser = (
  user: Record<string, unknown>,
  expected: { username: string; email: string },
) => {
  expect(user).toMatchObject({
    username: expected.username,
    email: expected.email,
  });

  expect(user.publicId).toEqual(expect.any(String));
  expect(user.createdAt).toBeDefined();
  expect(user.password).toBeUndefined();
  expect(user.passwordHash).toBeUndefined();
};
