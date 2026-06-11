import { useState } from 'react';

interface CounterProps {
  initial?: number;
}

export default function Counter({ initial = 0 }: CounterProps) {
  const [count, setCount] = useState(initial);

  return (
    <div className="rounded-lg bg-white p-4 shadow-md">
      <p className="text-lg font-semibold">Count: {count}</p>
      <div className="mt-2 space-x-2">
        <button
          onClick={() => setCount(count - 1)}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          type="button"
        >
          -
        </button>
        <button
          onClick={() => setCount(0)}
          className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
          type="button"
        >
          Reset
        </button>
        <button
          onClick={() => setCount(count + 1)}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          type="button"
        >
          +
        </button>
      </div>
    </div>
  );
}
