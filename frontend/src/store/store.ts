import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../slices/userSlice";
import todoReducer from "../slices/todoslice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    todos: todoReducer
  },
});

export type appDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
