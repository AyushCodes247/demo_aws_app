import { useDispatch, useSelector } from "react-redux";
import type { appDispatch, RootState } from "../store/store";

export const AppDispatch = useDispatch.withTypes<appDispatch>();
export const AppSelector = useSelector.withTypes<RootState>();
