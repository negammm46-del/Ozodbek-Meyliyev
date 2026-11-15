import { useState } from 'react';

interface CountryFlagProps {
  code: string;
  name: string;
  className?: string;
}

const CUSTOM_SVG_CODES = new Set([
  'UZ', 'JP', 'BR', 'EG', 'NO', 'AU', 'CH', 'CA', 'IN', 'PE',
  'KE', 'IS', 'US', 'CN', 'KZ', 'TR', 'DE', 'FR', 'IT', 'GB',
  'AR', 'SA', 'ID', 'ZA', 'NZ', 'MX', 'KR', 'MA',
]);

export function CountryFlag({
  code,
  name,
  className = 'w-10 h-7',
}: CountryFlagProps) {
  const c = code.toUpperCase();
  const [imgFailed, setImgFailed] = useState(false);

  if (!CUSTOM_SVG_CODES.has(c)) {
    if (!imgFailed && /^[A-Z]{2}$/.test(c)) {
      return (
        <img
          src={`https://flagcdn.com/${c.toLowerCase()}.svg`}
          alt={`${name} bayrog‘i`}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setImgFailed(true)}
          className={`${className} object-cover rounded-sm border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs bg-slate-100 dark:bg-slate-800`}
        />
      );
    }

    return (
      <svg
        viewBox="0 0 30 20"
        className={`${className} rounded-sm border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs`}
        role="img"
        aria-label={`${name} bayrog‘i`}
      >
        <rect width="30" height="20" fill="#0F172A" />
        <rect width="30" height="7" y="0" fill="#0284C7" />
        <rect width="30" height="6.5" y="13.5" fill="#10B981" />
        <text
          x="15"
          y="12.2"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="6.8"
          fontWeight="700"
          fontFamily="monospace"
        >
          {c.slice(0, 2)}
        </text>
      </svg>
    );
  }

  const renderFlagContent = () => {
    switch (c) {
      case 'UZ':
        return (
          <>
            <rect width="30" height="6.4" y="0" fill="#0099B5" />
            <rect width="30" height="0.6" y="6.4" fill="#CE1126" />
            <rect width="30" height="6" y="7" fill="#FFFFFF" />
            <rect width="30" height="0.6" y="13" fill="#CE1126" />
            <rect width="30" height="6.4" y="13.6" fill="#1EB53A" />
            <circle cx="4.5" cy="3.2" r="1.7" fill="#FFFFFF" />
            <circle cx="5.2" cy="3.2" r="1.4" fill="#0099B5" />
            <circle cx="7.8" cy="2.2" r="0.35" fill="#FFFFFF" />
            <circle cx="9.2" cy="2.2" r="0.35" fill="#FFFFFF" />
            <circle cx="7.8" cy="3.8" r="0.35" fill="#FFFFFF" />
            <circle cx="9.2" cy="3.8" r="0.35" fill="#FFFFFF" />
          </>
        );
      case 'JP':
        return (
          <>
            <rect width="30" height="20" fill="#FFFFFF" />
            <circle cx="15" cy="10" r="5.5" fill="#BC002D" />
          </>
        );
      case 'BR':
        return (
          <>
            <rect width="30" height="20" fill="#009B3A" />
            <polygon points="15,2.5 27,10 15,17.5 3,10" fill="#FFDF00" />
            <circle cx="15" cy="10" r="4.2" fill="#002776" />
            <path
              d="M11.1 9.5 Q15 11.2 18.9 10.6"
              stroke="#FFFFFF"
              strokeWidth="0.8"
              fill="none"
            />
          </>
        );
      case 'EG':
        return (
          <>
            <rect width="30" height="6.7" y="0" fill="#CE1126" />
            <rect width="30" height="6.6" y="6.7" fill="#FFFFFF" />
            <rect width="30" height="6.7" y="13.3" fill="#000000" />
            <circle cx="15" cy="10" r="1.8" fill="#C09300" />
          </>
        );
      case 'NO':
        return (
          <>
            <rect width="30" height="20" fill="#BA0C2F" />
            <rect width="5" height="20" x="8" fill="#FFFFFF" />
            <rect width="30" height="5" y="7.5" fill="#FFFFFF" />
            <rect width="2.8" height="20" x="9.1" fill="#00205B" />
            <rect width="30" height="2.8" y="8.6" fill="#00205B" />
          </>
        );
      case 'AU':
        return (
          <>
            <rect width="30" height="20" fill="#012169" />
            <rect width="14" height="10" fill="#012169" />
            <path d="M0,0 L14,10 M14,0 L0,10" stroke="#FFFFFF" strokeWidth="1.6" />
            <path d="M7,0 V10 M0,5 H14" stroke="#FFFFFF" strokeWidth="2.8" />
            <path d="M7,0 V10 M0,5 H14" stroke="#C8102E" strokeWidth="1.5" />
            <circle cx="7" cy="15" r="1.5" fill="#FFFFFF" />
            <circle cx="22" cy="5.5" r="0.9" fill="#FFFFFF" />
            <circle cx="25" cy="9.5" r="0.9" fill="#FFFFFF" />
            <circle cx="21" cy="12" r="0.9" fill="#FFFFFF" />
            <circle cx="23" cy="15.5" r="0.9" fill="#FFFFFF" />
          </>
        );
      case 'CH':
        return (
          <>
            <rect width="30" height="20" fill="#D52B1E" />
            <rect width="11" height="3.6" x="9.5" y="8.2" fill="#FFFFFF" />
            <rect width="3.6" height="11" x="13.2" y="4.5" fill="#FFFFFF" />
          </>
        );
      case 'CA':
        return (
          <>
            <rect width="7.5" height="20" x="0" fill="#D80621" />
            <rect width="15" height="20" x="7.5" fill="#FFFFFF" />
            <rect width="7.5" height="20" x="22.5" fill="#D80621" />
            <polygon
              points="15,4.2 16.5,7.8 19.5,7 18,10.5 20,12 16,12.8 15.5,16 14.5,16 14,12.8 10,12 12,10.5 10.5,7 13.5,7.8"
              fill="#D80621"
            />
          </>
        );
      case 'IN':
        return (
          <>
            <rect width="30" height="6.7" y="0" fill="#FF9933" />
            <rect width="30" height="6.6" y="6.7" fill="#FFFFFF" />
            <rect width="30" height="6.7" y="13.3" fill="#138808" />
            <circle
              cx="15"
              cy="10"
              r="2.4"
              fill="none"
              stroke="#000080"
              strokeWidth="0.7"
            />
            <circle cx="15" cy="10" r="0.7" fill="#000080" />
          </>
        );
      case 'PE':
        return (
          <>
            <rect width="10" height="20" x="0" fill="#D91023" />
            <rect width="10" height="20" x="10" fill="#FFFFFF" />
            <rect width="10" height="20" x="20" fill="#D91023" />
          </>
        );
      case 'KE':
        return (
          <>
            <rect width="30" height="5.5" y="0" fill="#000000" />
            <rect width="30" height="1" y="5.5" fill="#FFFFFF" />
            <rect width="30" height="7" y="6.5" fill="#BB0000" />
            <rect width="30" height="1" y="13.5" fill="#FFFFFF" />
            <rect width="30" height="5.5" y="14.5" fill="#006600" />
            <ellipse cx="15" cy="10" rx="2.1" ry="3.8" fill="#BB0000" stroke="#FFFFFF" strokeWidth="0.6" />
          </>
        );
      case 'IS':
        return (
          <>
            <rect width="30" height="20" fill="#02529C" />
            <rect width="5" height="20" x="8" fill="#FFFFFF" />
            <rect width="30" height="5" y="7.5" fill="#FFFFFF" />
            <rect width="2.6" height="20" x="9.2" fill="#DC1E35" />
            <rect width="30" height="2.6" y="8.7" fill="#DC1E35" />
          </>
        );
      case 'US':
        return (
          <>
            <rect width="30" height="20" fill="#FFFFFF" />
            {[0, 2, 4, 6, 8, 10, 12].map((i) => (
              <rect
                key={i}
                width="30"
                height="1.54"
                y={i * 1.54}
                fill="#B22234"
              />
            ))}
            <rect width="13.5" height="10.8" fill="#3C3B6E" />
            <circle cx="3.5" cy="3" r="0.6" fill="#FFFFFF" />
            <circle cx="6.8" cy="3" r="0.6" fill="#FFFFFF" />
            <circle cx="10" cy="3" r="0.6" fill="#FFFFFF" />
            <circle cx="5.2" cy="5.5" r="0.6" fill="#FFFFFF" />
            <circle cx="8.5" cy="5.5" r="0.6" fill="#FFFFFF" />
            <circle cx="3.5" cy="8" r="0.6" fill="#FFFFFF" />
            <circle cx="6.8" cy="8" r="0.6" fill="#FFFFFF" />
            <circle cx="10" cy="8" r="0.6" fill="#FFFFFF" />
          </>
        );
      case 'CN':
        return (
          <>
            <rect width="30" height="20" fill="#DE2910" />
            <polygon
              points="5.5,3 6.3,5.4 8.8,5.4 6.8,6.8 7.5,9.2 5.5,7.8 3.5,9.2 4.2,6.8 2.2,5.4 4.7,5.4"
              fill="#FFDE00"
            />
            <circle cx="10.5" cy="3" r="0.7" fill="#FFDE00" />
            <circle cx="12" cy="5" r="0.7" fill="#FFDE00" />
            <circle cx="12" cy="7.5" r="0.7" fill="#FFDE00" />
            <circle cx="10.5" cy="9.5" r="0.7" fill="#FFDE00" />
          </>
        );
      case 'KZ':
        return (
          <>
            <rect width="30" height="20" fill="#00AFCA" />
            <circle cx="15" cy="9" r="3.4" fill="#FEC50C" />
            <path d="M10.5,14 Q15,12 19.5,14" stroke="#FEC50C" strokeWidth="1.2" fill="none" />
            <rect width="2" height="16" x="2" y="2" fill="#FEC50C" />
          </>
        );
      case 'TR':
        return (
          <>
            <rect width="30" height="20" fill="#E30A17" />
            <circle cx="12" cy="10" r="4.5" fill="#FFFFFF" />
            <circle cx="13.2" cy="10" r="3.6" fill="#E30A17" />
            <polygon
              points="18.5,7.5 19.3,9.5 21.4,9.5 19.7,10.8 20.3,12.8 18.5,11.6 16.7,12.8 17.3,10.8 15.6,9.5 17.7,9.5"
              fill="#FFFFFF"
            />
          </>
        );
      case 'DE':
        return (
          <>
            <rect width="30" height="6.7" y="0" fill="#000000" />
            <rect width="30" height="6.6" y="6.7" fill="#DD0000" />
            <rect width="30" height="6.7" y="13.3" fill="#FFCE00" />
          </>
        );
      case 'FR':
        return (
          <>
            <rect width="10" height="20" x="0" fill="#002395" />
            <rect width="10" height="20" x="10" fill="#FFFFFF" />
            <rect width="10" height="20" x="20" fill="#ED2939" />
          </>
        );
      case 'IT':
        return (
          <>
            <rect width="10" height="20" x="0" fill="#009246" />
            <rect width="10" height="20" x="10" fill="#FFFFFF" />
            <rect width="10" height="20" x="20" fill="#CE2B37" />
          </>
        );
      case 'GB':
        return (
          <>
            <rect width="30" height="20" fill="#012169" />
            <path d="M0,0 L30,20 M30,0 L0,20" stroke="#FFFFFF" strokeWidth="3.5" />
            <path d="M0,0 L30,20 M30,0 L0,20" stroke="#C8102E" strokeWidth="1.6" />
            <path d="M15,0 V20 M0,10 H30" stroke="#FFFFFF" strokeWidth="5.5" />
            <path d="M15,0 V20 M0,10 H30" stroke="#C8102E" strokeWidth="3.2" />
          </>
        );
      case 'AR':
        return (
          <>
            <rect width="30" height="6.7" y="0" fill="#74ACDF" />
            <rect width="30" height="6.6" y="6.7" fill="#FFFFFF" />
            <rect width="30" height="6.7" y="13.3" fill="#74ACDF" />
            <circle cx="15" cy="10" r="2" fill="#F6B40E" />
          </>
        );
      case 'SA':
        return (
          <>
            <rect width="30" height="20" fill="#006C35" />
            <rect width="14" height="1.2" x="8" y="13.5" fill="#FFFFFF" />
            <path d="M9,8.5 Q15,7 21,8.5" stroke="#FFFFFF" strokeWidth="1.4" fill="none" />
          </>
        );
      case 'ID':
        return (
          <>
            <rect width="30" height="10" y="0" fill="#FF0000" />
            <rect width="30" height="10" y="10" fill="#FFFFFF" />
          </>
        );
      case 'ZA':
        return (
          <>
            <rect width="30" height="7" y="0" fill="#E03C31" />
            <rect width="30" height="6" y="7" fill="#FFFFFF" />
            <rect width="30" height="7" y="13" fill="#001489" />
            <polygon points="0,0 13,10 0,20" fill="#007749" />
            <polygon points="0,3 8.5,10 0,17" fill="#000000" stroke="#FFB81C" strokeWidth="1.2" />
          </>
        );
      case 'NZ':
        return (
          <>
            <rect width="30" height="20" fill="#012169" />
            <path d="M0,0 L14,10 M14,0 L0,10" stroke="#FFFFFF" strokeWidth="1.5" />
            <path d="M7,0 V10 M0,5 H14" stroke="#FFFFFF" strokeWidth="2.6" />
            <path d="M7,0 V10 M0,5 H14" stroke="#C8102E" strokeWidth="1.4" />
            <circle cx="22" cy="5.5" r="1.1" fill="#C8102E" stroke="#FFFFFF" strokeWidth="0.4" />
            <circle cx="25" cy="9.5" r="1.1" fill="#C8102E" stroke="#FFFFFF" strokeWidth="0.4" />
            <circle cx="21" cy="12" r="1.1" fill="#C8102E" stroke="#FFFFFF" strokeWidth="0.4" />
            <circle cx="23" cy="15.5" r="1.1" fill="#C8102E" stroke="#FFFFFF" strokeWidth="0.4" />
          </>
        );
      case 'MX':
        return (
          <>
            <rect width="10" height="20" x="0" fill="#006847" />
            <rect width="10" height="20" x="10" fill="#FFFFFF" />
            <rect width="10" height="20" x="20" fill="#CE1126" />
            <circle cx="15" cy="10" r="2.2" fill="#8B5A2B" />
          </>
        );
      case 'KR':
        return (
          <>
            <rect width="30" height="20" fill="#FFFFFF" />
            <path d="M15,5.5 A4.5,4.5 0 0,1 15,14.5 A2.25,2.25 0 0,1 15,10 A2.25,2.25 0 0,0 15,5.5" fill="#CD2E3A" />
            <path d="M15,14.5 A4.5,4.5 0 0,1 15,5.5 A2.25,2.25 0 0,1 15,10 A2.25,2.25 0 0,0 15,14.5" fill="#0047A0" />
            <rect width="3" height="0.8" x="5" y="4.5" fill="#000000" transform="rotate(-35 6.5 4.9)" />
            <rect width="3" height="0.8" x="22" y="4.5" fill="#000000" transform="rotate(35 23.5 4.9)" />
            <rect width="3" height="0.8" x="5" y="14.5" fill="#000000" transform="rotate(35 6.5 14.9)" />
            <rect width="3" height="0.8" x="22" y="14.5" fill="#000000" transform="rotate(-35 23.5 14.9)" />
          </>
        );
      case 'MA':
        return (
          <>
            <rect width="30" height="20" fill="#C1272D" />
            <polygon
              points="15,5.2 16.4,9.2 20.6,9.2 17.2,11.6 18.5,15.6 15,13.1 11.5,15.6 12.8,11.6 9.4,9.2 13.6,9.2"
              fill="none"
              stroke="#006233"
              strokeWidth="1.2"
            />
          </>
        );
      default:
        return (
          <>
            <rect width="30" height="20" fill="#0284C7" />
            <circle cx="15" cy="10" r="4" fill="#FFFFFF" fillOpacity="0.85" />
          </>
        );
    }
  };

  return (
    <svg
      viewBox="0 0 30 20"
      className={`${className} rounded-sm border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs`}
      role="img"
      aria-label={`${name} bayrog‘i`}
    >
      {renderFlagContent()}
    </svg>
  );
}
