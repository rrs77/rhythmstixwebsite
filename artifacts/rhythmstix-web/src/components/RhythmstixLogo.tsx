interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export function RhythmstixLogo({ size = 200, className = "", showText = true }: LogoProps) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div
        className="bg-[hsl(180,30%,12%)] rounded-xl flex flex-col items-center justify-center"
        style={{ width: size, height: showText ? size * 1.2 : size, padding: size * 0.1 }}
      >
        <svg
          viewBox="0 0 200 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: size * 0.7, height: size * 0.7 }}
        >
          <line x1="60" y1="20" x2="140" y2="150" stroke="white" strokeWidth="4" strokeLinecap="round" />
          <line x1="140" y1="20" x2="60" y2="150" stroke="white" strokeWidth="4" strokeLinecap="round" />

          <circle cx="56" cy="14" r="8" fill="white" />
          <circle cx="144" cy="14" r="8" fill="white" />

          <path d="M48 155 C48 148, 55 142, 60 150 C65 158, 50 162, 48 155Z" fill="white" opacity="0.9" />
          <path d="M40 150 C38 144, 44 138, 52 145" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M44 158 C40 154, 42 148, 48 152" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />

          <path d="M152 155 C152 148, 145 142, 140 150 C135 158, 150 162, 152 155Z" fill="white" opacity="0.9" />
          <path d="M160 150 C162 144, 156 138, 148 145" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M156 158 C160 154, 158 148, 152 152" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />

          <line x1="40" y1="140" x2="160" y2="140" stroke="white" strokeWidth="3" />
        </svg>

        {showText && (
          <>
            <div className="text-white text-center mt-2" style={{ letterSpacing: '0.25em', fontSize: size * 0.07 }}>
              RHYTHMSTIX
            </div>
            <div className="text-white/70 text-center mt-1" style={{ letterSpacing: '0.15em', fontSize: size * 0.04 }}>
              MUSIC FOR EDUCATION
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function RhythmstixIcon({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <div
      className={`bg-[hsl(180,30%,12%)] flex items-center justify-center rounded-lg ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 200 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: size * 0.7, height: size * 0.7 }}
      >
        <line x1="60" y1="20" x2="140" y2="150" stroke="white" strokeWidth="6" strokeLinecap="round" />
        <line x1="140" y1="20" x2="60" y2="150" stroke="white" strokeWidth="6" strokeLinecap="round" />
        <circle cx="56" cy="14" r="10" fill="white" />
        <circle cx="144" cy="14" r="10" fill="white" />
        <line x1="40" y1="140" x2="160" y2="140" stroke="white" strokeWidth="5" />
      </svg>
    </div>
  );
}
