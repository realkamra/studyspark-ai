import { motion } from "framer-motion";

export type FoxMood = "idle" | "thinking" | "excited" | "sad";

const moods: Record<
  FoxMood,
  { body: string; belly: string; wiggle: number }
> = {
  idle: { body: "#2563eb", belly: "#dbeafe", wiggle: 0 },
  thinking: { body: "#9eb8ff", belly: "#e4edff", wiggle: -2 },
  excited: { body: "#2563eb", belly: "#dbeafe", wiggle: 3 },
  sad: { body: "#c9cec9", belly: "#eef0ee", wiggle: -1 },
};

export function FoxMascot({
  mood = "idle",
  size = 96,
  className = "",
}: {
  mood?: FoxMood;
  size?: number;
  className?: string;
}) {
  const colors = moods[mood];

  return (
    <motion.div
      role="img"
      aria-label={`Notefox fox, feeling ${mood}`}
      animate={{ rotate: [0, colors.wiggle, 0, -colors.wiggle / 2, 0] }}
      transition={{
        repeat: Infinity,
        duration: mood === "excited" ? 1.1 : 3.4,
        ease: "easeInOut",
      }}
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 120 120" width={size} height={size} fill="none">
        {/* ears */}
        <path d="M22 34 L34 6 L52 26 Z" fill={colors.body} stroke="#1e293b" strokeWidth="4" strokeLinejoin="round" />
        <path d="M98 34 L86 6 L68 26 Z" fill={colors.body} stroke="#1e293b" strokeWidth="4" strokeLinejoin="round" />
        {/* head */}
        <path
          d="M18 52 C18 32 36 22 60 22 C84 22 102 32 102 52 C102 76 84 98 60 98 C36 98 18 76 18 52 Z"
          fill={colors.body}
          stroke="#1e293b"
          strokeWidth="4"
        />
        {/* cheeks / muzzle */}
        <ellipse cx="60" cy="74" rx="26" ry="18" fill={colors.belly} />
        {/* eyes */}
        {mood === "thinking" ? (
          <>
            <rect x="38" y="46" width="12" height="4" rx="2" fill="#1e293b" />
            <rect x="70" y="46" width="12" height="4" rx="2" fill="#1e293b" />
          </>
        ) : mood === "sad" ? (
          <>
            <path d="M38 48 L50 52" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
            <path d="M82 48 L70 52" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="44" cy="50" r="5" fill="#1e293b" />
            <circle cx="76" cy="50" r="5" fill="#1e293b" />
            <circle cx="46" cy="48" r="1.6" fill="#ffffff" />
            <circle cx="78" cy="48" r="1.6" fill="#ffffff" />
          </>
        )}
        {/* nose */}
        <path d="M56 66 L64 66 L60 71 Z" fill="#1e293b" />
        {/* mouth */}
        {mood === "excited" ? (
          <path d="M50 74 Q60 84 70 74 Q60 78 50 74 Z" fill="#1e293b" />
        ) : mood === "sad" ? (
          <path d="M52 79 Q60 73 68 79" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" fill="none" />
        ) : (
          <path d="M52 74 Q60 80 68 74" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" fill="none" />
        )}
      </svg>
    </motion.div>
  );
}
