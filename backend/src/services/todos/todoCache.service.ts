import redis from "@configs/redis.config.js";

const TODO_LIST_CACHE_TTL = 5 * 60;
const TODO_CACHE_TTL = 5 * 60;
const TODO_STATS_CACHE_TTL = 60;

const getTodoListKey = (userPublicId: string): string =>
  `todos:list:${userPublicId}`;

const getTodoKey = (userPublicId: string, todoId: string): string =>
  `todos:${userPublicId}:${todoId}`;

const getTodoStatsKey = (userPublicId: string): string =>
  `todos:stats:${userPublicId}`;

const getCache = async (key: string): Promise<string | null> => {
  return redis.get(key);
};

const setCache = async (
  key: string,
  data: unknown,
  ttl: number,
): Promise<void> => {
  await redis.set(key, JSON.stringify(data), "EX", ttl);
};

export const getCachedTodoList = async (
  userPublicId: string,
): Promise<string | null> => {
  return getCache(getTodoListKey(userPublicId));
};

export const cacheTodoList = async (
  userPublicId: string,
  todos: unknown,
): Promise<void> => {
  await setCache(getTodoListKey(userPublicId), todos, TODO_LIST_CACHE_TTL);
};

export const getCachedTodo = async (
  userPublicId: string,
  todoId: string,
): Promise<string | null> => {
  return getCache(getTodoKey(userPublicId, todoId));
};

export const cacheTodo = async (
  userPublicId: string,
  todoId: string,
  todo: unknown,
): Promise<void> => {
  await setCache(getTodoKey(userPublicId, todoId), todo, TODO_CACHE_TTL);
};

export const getCachedTodoStats = async (
  userPublicId: string,
): Promise<string | null> => {
  return getCache(getTodoStatsKey(userPublicId));
};

export const cacheTodoStats = async (
  userPublicId: string,
  stats: unknown,
): Promise<void> => {
  await setCache(getTodoStatsKey(userPublicId), stats, TODO_STATS_CACHE_TTL);
};

export const invalidateTodoCache = async (
  userPublicId: string,
  todoId?: string,
): Promise<void> => {
  const keys = [getTodoListKey(userPublicId), getTodoStatsKey(userPublicId)];

  if (todoId) {
    keys.push(getTodoKey(userPublicId, todoId));
  }

  await redis.del(...keys);
};
