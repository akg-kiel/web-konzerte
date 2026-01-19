import React, { useState } from 'react';

interface CounterProps {
  initial?: number;
}

export default function Counter({ initial = 0 }: CounterProps) {
  const [count, setCount] = useState(initial);

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <p className="text-lg font-semibold">Count: {count}</p>
      <div className="mt-2 space-x-2">
        <button
          onClick={() => setCount(count - 1)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          type="button"
        >
          -
        </button>
        <button
          onClick={() => setCount(0)}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          type="button"
        >
          Reset
        </button>
        <button
          onClick={() => setCount(count + 1)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          type="button"
        >
          +
        </button>
      </div>
    </div>
  );
}
