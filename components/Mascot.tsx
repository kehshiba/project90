type Mood = "excited" | "proud" | "happy" | "ready";

function Sparkle({
  x,
  y,
  size,
  delay,
}: {
  x: number;
  y: number;
  size: number;
  delay?: string;
}) {
  return (
    <path
      className="mascot-sparkle"
      style={{ animationDelay: delay }}
      transform={`translate(${x} ${y})`}
      d={`M0 -${size} C2 -2 2 -2 ${size} 0 C2 2 2 2 0 ${size} C-2 2 -2 2 -${size} 0 C-2 -2 -2 -2 0 -${size} Z`}
      fill="#d4aa55"
      opacity="0.8"
    />
  );
}

export function Mascot({
  mood = "ready",
  className = "",
}: {
  mood?: Mood;
  className?: string;
}) {
  const excited = mood === "excited";
  const proud = mood === "proud";
  const happy = mood === "happy";

  return (
    <svg
      viewBox="0 0 260 252"
      className={`mascot-wrap ${className}`}
      role="img"
      aria-label={
        excited
          ? "A cheerful sprout mascot celebrating your streak"
          : happy
            ? "A happy sprout mascot cheering you on"
            : proud
              ? "A proud sprout mascot flexing"
              : "A friendly sprout mascot ready to start"
      }
    >
      <ellipse cx="130" cy="227" rx="72" ry="11" fill="#ded7c7" opacity="0.62" />

      {/* leaves */}
      <g stroke="#38533e" strokeWidth="3" strokeLinecap="round">
        <path d="M130 62 C129 45 133 32 143 20" fill="none" />
        <path
          d="M143 23C157 14 175 20 178 35C164 44 149 39 143 23Z"
          fill="#c6ddba"
        />
        <path
          d="M130 57C117 39 100 38 90 48C97 63 113 68 130 57Z"
          fill="#8fb596"
        />
        <path d="M132 64 C134 51 144 43 156 41" fill="none" opacity="0.4" />
      </g>

      {/* arms */}
      {excited ? (
        <g fill="#b5d1b0" stroke="#38533e" strokeWidth="3" strokeLinecap="round">
          <path
            d="M72 128 C52 112 45 91 52 74"
            fill="none"
            strokeWidth="10"
          />
          <circle cx="53" cy="69" r="10" />
          <path
            d="M188 128 C208 112 215 91 208 74"
            fill="none"
            strokeWidth="10"
          />
          <circle cx="207" cy="69" r="10" />
        </g>
      ) : (
        <g fill="#b5d1b0" stroke="#38533e" strokeWidth="3" strokeLinecap="round">
          <path
            d={proud ? "M72 128 C49 123 37 138 44 158" : "M72 133 C53 136 46 149 52 163"}
            fill="none"
            strokeWidth="10"
          />
          <circle cx={proud ? 48 : 55} cy={proud ? 163 : 168} r="9" />
          <path
            d={proud ? "M188 128 C211 123 223 138 216 158" : "M188 133 C207 136 214 149 208 163"}
            fill="none"
            strokeWidth="10"
          />
          <circle cx={proud ? 212 : 205} cy={proud ? 163 : 168} r="9" />
        </g>
      )}

      {/* body */}
      <path
        d="M130 55C174 55 199 87 196 134C194 176 168 205 130 205C92 205 66 176 64 134C61 87 86 55 130 55Z"
        fill="#b5d1b0"
        stroke="#38533e"
        strokeWidth="3.5"
      />
      <path
        d="M89 96C94 70 111 61 130 61C150 61 168 73 174 91C153 82 112 81 89 96Z"
        fill="#d1e3c5"
        opacity="0.7"
      />

      {/* headband */}
      <path
        d="M65 100C92 87 168 87 195 100L192 118C164 106 96 106 68 118L65 100Z"
        fill="#35553f"
        stroke="#38533e"
        strokeWidth="2"
      />
      <path
        d="M76 109C99 101 161 101 184 109"
        fill="none"
        stroke="#dce8cd"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.72"
      />
      <path
        d="M191 106L208 112L202 122"
        fill="#35553f"
        stroke="#38533e"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* face */}
      <g fill="#2f4636">
        {excited ? (
          <>
            <path
              d="M101 137C106 129 113 129 118 137"
              fill="none"
              stroke="#2f4636"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M143 137C148 129 155 129 160 137"
              fill="none"
              stroke="#2f4636"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </>
        ) : happy ? (
          <>
            <circle cx="109" cy="136" r="4.2" />
            <path
              d="M144 136C148 132 154 132 158 136"
              fill="none"
              stroke="#2f4636"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <circle cx="111" cy="134.5" r="1.2" fill="#f8f4e8" />
          </>
        ) : proud ? (
          <>
            <path
              d="M103 137C108 130 114 130 119 137"
              fill="none"
              stroke="#2f4636"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M142 137C147 130 153 130 158 137"
              fill="none"
              stroke="#2f4636"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path d="M120 120L145 126" stroke="#2f4636" strokeWidth="3" strokeLinecap="round" />
            <path d="M158 118L173 123" stroke="#2f4636" strokeWidth="3" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx="109" cy="136" rx="4" ry="5" />
            <ellipse cx="152" cy="136" rx="4" ry="5" />
            <circle cx="110.6" cy="134.4" r="1.2" fill="#f8f4e8" />
            <circle cx="153.6" cy="134.4" r="1.2" fill="#f8f4e8" />
          </>
        )}
      </g>

      {/* cheeks */}
      <ellipse cx="93" cy="150" rx="10" ry="5.5" fill="#e8b1a1" opacity="0.6" />
      <ellipse cx="168" cy="150" rx="10" ry="5.5" fill="#e8b1a1" opacity="0.6" />

      {/* mouth */}
      {excited ? (
        <g>
          <path
            d="M117 148C123 144 137 144 143 148C143 160 135 166 130 166C125 166 117 160 117 148Z"
            fill="#2f4636"
          />
          <path
            d="M124 159C127 156 133 156 136 159C133 163 127 163 124 159Z"
            fill="#df9f91"
          />
        </g>
      ) : (
        <path
          d={proud ? "M115 149C123 158 137 158 145 149" : "M119 150C125 156 135 156 141 150"}
          fill="none"
          stroke="#2f4636"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
      )}

      {/* little shoes */}
      <g stroke="#38533e" strokeWidth="2.5">
        <path
          d="M92 200C87 208 91 214 102 214H114C118 214 119 202 112 200Z"
          fill="#f1eadb"
        />
        <path
          d="M168 200C173 208 169 214 158 214H146C142 214 141 202 148 200Z"
          fill="#f1eadb"
        />
      </g>

      {/* fitness buddy details */}
      {proud ? (
        <g>
          <path
            d="M57 157C61 160 63 165 62 170"
            fill="none"
            stroke="#38533e"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M61 157C65 160 67 165 66 170"
            fill="none"
            stroke="#38533e"
            strokeWidth="2.4"
            strokeLinecap="round"
            opacity="0.55"
          />
        </g>
      ) : null}

      {excited ? (
        <>
          <Sparkle x={35} y={70} size={8} />
          <Sparkle x={225} y={51} size={6} delay="0.7s" />
          <Sparkle x={219} y={174} size={5} delay="1.2s" />
          <path
            d="M42 174C49 171 55 173 57 179"
            fill="none"
            stroke="#d4aa55"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity="0.65"
          />
        </>
      ) : (
        <Sparkle x={218} y={61} size={5} delay="0.4s" />
      )}
    </svg>
  );
}
