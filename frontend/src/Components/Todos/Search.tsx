
import { useEffect } from "react";
import { Search as SearchIcon, X } from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../hooks/appHook";
import { setTodoSearch } from "../../slices/todoslice";

const Search = () => {
  const dispatch = useAppDispatch();
  const search = useAppSelector((state) => state.todos.search);

  useEffect(() => {
    // Search state is managed by Redux.
  }, []);

  const handleClear = () => {
    dispatch(setTodoSearch(""));
  };

  return (
    <form
      role="search"
      onSubmit={(event) => event.preventDefault()}
      className="w-full"
    >
      <label htmlFor="todo-search" className="sr-only">
        Search tasks
      </label>

      <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#111113] px-4 transition focus-within:border-violet-500/60 focus-within:ring-2 focus-within:ring-violet-500/20">
        <SearchIcon
          size={19}
          className="shrink-0 text-zinc-500"
          aria-hidden="true"
        />

        <input
          id="todo-search"
          type="search"
          value={search}
          onChange={(event) => dispatch(setTodoSearch(event.target.value))}
          placeholder="Search your tasks..."
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent py-3.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
        />

        {search && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="rounded-md p-1.5 text-zinc-500 transition hover:bg-white/[0.06] hover:text-white"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    </form>
  );
};

export default Search;
