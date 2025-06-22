'use client'

export function ConnectionLine() {
  return (
    <div className="hidden md:block">
      <svg
        width="200"
        height="100"
        viewBox="0 0 200 100"
        className="text-blue-500"
      >
        {/* Connection path */}
        <path
          className="connection-path"
          d="M 20 50 Q 100 20 180 50"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeDasharray="5,5"
        >
          <animate
            attributeName="stroke-dashoffset"
            values="0;10"
            dur="1s"
            repeatCount="indefinite"
          />
        </path>
        
        {/* Following checkmark */}
        <circle
          cx="100"
          cy="35"
          r="15"
          fill="currentColor"
          className="text-green-500 animate-pulse"
        />
        <path
          d="M 93 35 L 98 40 L 107 31"
          stroke="white"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Transfer icon (initially hidden) */}
        <g className="transfer-icon opacity-0">
          <circle cx="20" cy="50" r="8" fill="currentColor" className="text-yellow-500" />
          <text
            x="20"
            y="55"
            textAnchor="middle"
            fontSize="10"
            fill="white"
            className="font-bold"
          >
            🎁
          </text>
        </g>
      </svg>
      
      {/* Text label */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-8">
        <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium">
          ✅ 已关注
        </div>
      </div>
    </div>
  )
} 