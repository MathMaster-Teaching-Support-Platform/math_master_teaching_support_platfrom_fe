import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Download,
  Lock,
  Search,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockAdmin, mockStudent, mockTeacher } from '../../data/mockData';
import { AuthService } from '../../services/api/auth.service';
import { UserService } from '../../services/api/user.service';
import { WalletService } from '../../services/api/wallet.service';
import type { TransactionStatus, WalletSummary, WalletTransaction } from '../../types/wallet.types';
import './StudentWallet.css';

type TransactionStatusFilter = 'all' | 'completed' | 'pending' | 'failed' | 'cancelled';
type PaymentMethod = 'payos' | 'visa' | 'mastercard';

const PAYMENT_METHODS: { id: PaymentMethod; name: string; sub: string }[] = [
  { id: 'payos', name: 'PayOS', sub: 'QR / Chuyển khoản' },
  { id: 'visa', name: 'Visa', sub: 'Thẻ quốc tế' },
  { id: 'mastercard', name: 'Mastercard', sub: 'Thẻ quốc tế' },
];

const QUICK_AMOUNTS = [50_000, 100_000, 200_000, 500_000, 1_000_000];

type CardTemplate = {
  id: number;
  label: string;
  gradient: string;
  swatch: string;
  patternEl: React.ReactNode;
};

const VISA_TEMPLATES: CardTemplate[] = [
  /* 0 ── Infinite Blue (VCB Infinite) */
  {
    id: 0,
    label: 'Infinite Blue',
    gradient: 'linear-gradient(160deg,#060d1f 0%,#0b1d47 35%,#0e2d6b 65%,#1246a8 100%)',
    swatch: '#0b1d47',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          d="M-30 140 C70 112,150 168,240 140 C310 118,370 150,430 132"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M-30 158 C70 130,150 186,240 158 C310 136,370 168,430 150"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M-30 176 C70 148,150 204,240 176 C310 154,370 186,430 168"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1.5"
          fill="none"
        />
        <circle
          cx="338"
          cy="28"
          r="90"
          stroke="rgba(100,170,255,0.09)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="338"
          cy="28"
          r="65"
          stroke="rgba(100,170,255,0.07)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="338"
          cy="28"
          r="40"
          stroke="rgba(100,170,255,0.06)"
          strokeWidth="1"
          fill="none"
        />
      </svg>
    ),
  },
  /* 1 ── Noir (Black Centurion) */
  {
    id: 1,
    label: 'Noir',
    gradient: 'linear-gradient(135deg,#080808 0%,#141414 50%,#1e1e1e 100%)',
    swatch: '#141414',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <line x1="-10" y1="0" x2="220" y2="220" stroke="rgba(255,255,255,0.035)" strokeWidth="1" />
        <line x1="35" y1="0" x2="265" y2="220" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <line x1="80" y1="0" x2="310" y2="220" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <line x1="125" y1="0" x2="355" y2="220" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
        <circle
          cx="358"
          cy="-8"
          r="155"
          stroke="rgba(255,255,255,0.045)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="358"
          cy="-8"
          r="115"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="358"
          cy="-8"
          r="75"
          stroke="rgba(255,255,255,0.035)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="358"
          cy="-8"
          r="40"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="1"
          fill="none"
        />
      </svg>
    ),
  },
  /* 2 ── Rosé Gold */
  {
    id: 2,
    label: 'Rosé Gold',
    gradient: 'linear-gradient(140deg,#2d0a16 0%,#7a2037 35%,#b54462 65%,#d4788e 100%)',
    swatch: '#7a2037',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <circle
          cx="310"
          cy="110"
          r="130"
          stroke="rgba(255,200,215,0.12)"
          strokeWidth="1.5"
          fill="none"
        />
        <circle
          cx="310"
          cy="110"
          r="95"
          stroke="rgba(255,200,215,0.10)"
          strokeWidth="1.5"
          fill="none"
        />
        <circle
          cx="310"
          cy="110"
          r="60"
          stroke="rgba(255,200,215,0.08)"
          strokeWidth="1.5"
          fill="none"
        />
        <line x1="0" y1="0" x2="110" y2="220" stroke="rgba(255,200,215,0.07)" strokeWidth="0.8" />
        <line x1="55" y1="0" x2="165" y2="220" stroke="rgba(255,200,215,0.05)" strokeWidth="0.8" />
        <circle cx="48" cy="38" r="2.5" fill="rgba(255,200,215,0.18)" />
        <circle cx="90" cy="72" r="1.5" fill="rgba(255,200,215,0.14)" />
        <circle cx="140" cy="28" r="2" fill="rgba(255,200,215,0.16)" />
        <circle cx="28" cy="178" r="1.5" fill="rgba(255,200,215,0.12)" />
      </svg>
    ),
  },
  /* 3 ── Jade Circuit (VPBank Neo) */
  {
    id: 3,
    label: 'Jade Circuit',
    gradient: 'linear-gradient(145deg,#011a10 0%,#033a22 40%,#055a34 70%,#077a46 100%)',
    swatch: '#033a22',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          d="M20 55 L80 55 L80 105 L160 105 L160 65 L240 65"
          stroke="rgba(0,255,120,0.10)"
          strokeWidth="1"
          fill="none"
        />
        <path
          d="M280 165 L280 125 L340 125 L340 80"
          stroke="rgba(0,255,120,0.08)"
          strokeWidth="1"
          fill="none"
        />
        <path
          d="M10 155 L60 155 L60 185 L130 185"
          stroke="rgba(0,255,120,0.08)"
          strokeWidth="1"
          fill="none"
        />
        <path
          d="M195 32 L195 82 L255 82 L255 142 L325 142"
          stroke="rgba(0,255,120,0.07)"
          strokeWidth="1"
          fill="none"
        />
        <circle cx="80" cy="55" r="3" fill="rgba(0,255,120,0.18)" />
        <circle cx="160" cy="105" r="3" fill="rgba(0,255,120,0.18)" />
        <circle cx="240" cy="65" r="3" fill="rgba(0,255,120,0.14)" />
        <circle cx="280" cy="125" r="3" fill="rgba(0,255,120,0.14)" />
        <circle cx="195" cy="82" r="2.5" fill="rgba(0,255,120,0.12)" />
        <circle cx="255" cy="142" r="2.5" fill="rgba(0,255,120,0.12)" />
        <circle
          cx="360"
          cy="200"
          r="60"
          stroke="rgba(0,255,120,0.06)"
          strokeWidth="1"
          fill="none"
        />
      </svg>
    ),
  },
  /* 4 ── Cosmos (BIDV Purple Infinite) */
  {
    id: 4,
    label: 'Cosmos',
    gradient: 'linear-gradient(145deg,#0d0420 0%,#1e0a45 40%,#330e6b 70%,#4c1eaa 100%)',
    swatch: '#1e0a45',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          d="M38 28 L54 18 L70 28 L70 48 L54 58 L38 48 Z"
          stroke="rgba(180,130,255,0.09)"
          strokeWidth="1"
          fill="none"
        />
        <path
          d="M70 48 L86 38 L102 48 L102 68 L86 78 L70 68 Z"
          stroke="rgba(180,130,255,0.08)"
          strokeWidth="1"
          fill="none"
        />
        <path
          d="M282 58 L298 48 L314 58 L314 78 L298 88 L282 78 Z"
          stroke="rgba(180,130,255,0.08)"
          strokeWidth="1"
          fill="none"
        />
        <path
          d="M314 98 L330 88 L346 98 L346 118 L330 128 L314 118 Z"
          stroke="rgba(180,130,255,0.07)"
          strokeWidth="1"
          fill="none"
        />
        <circle cx="158" cy="38" r="1.8" fill="rgba(255,255,255,0.32)" />
        <circle cx="218" cy="68" r="1.2" fill="rgba(255,255,255,0.28)" />
        <circle cx="292" cy="28" r="1.8" fill="rgba(255,255,255,0.32)" />
        <circle cx="118" cy="88" r="1.2" fill="rgba(255,255,255,0.24)" />
        <circle cx="78" cy="168" r="1.8" fill="rgba(255,255,255,0.22)" />
        <circle cx="322" cy="178" r="1.8" fill="rgba(255,255,255,0.24)" />
        <ellipse cx="298" cy="162" rx="78" ry="48" fill="rgba(120,50,200,0.08)" />
      </svg>
    ),
  },
  /* 5 ── Amber Gold */
  {
    id: 5,
    label: 'Amber Gold',
    gradient: 'linear-gradient(145deg,#1a0e00 0%,#4a2800 35%,#7a4400 65%,#b06a00 100%)',
    swatch: '#4a2800',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <line x1="-20" y1="0" x2="220" y2="220" stroke="rgba(255,200,80,0.07)" strokeWidth="0.9" />
        <line x1="22" y1="0" x2="262" y2="220" stroke="rgba(255,200,80,0.06)" strokeWidth="0.9" />
        <line x1="64" y1="0" x2="304" y2="220" stroke="rgba(255,200,80,0.05)" strokeWidth="0.9" />
        <line x1="106" y1="0" x2="346" y2="220" stroke="rgba(255,200,80,0.05)" strokeWidth="0.9" />
        <circle
          cx="358"
          cy="18"
          r="55"
          stroke="rgba(255,200,80,0.10)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="358"
          cy="18"
          r="38"
          stroke="rgba(255,200,80,0.08)"
          strokeWidth="1"
          fill="none"
        />
        <circle cx="358" cy="18" r="22" fill="rgba(255,200,80,0.06)" />
        <line x1="0" y1="202" x2="380" y2="202" stroke="rgba(255,200,80,0.08)" strokeWidth="0.6" />
        <circle cx="22" cy="198" r="3" fill="rgba(255,200,80,0.12)" />
        <circle cx="358" cy="198" r="3" fill="rgba(255,200,80,0.12)" />
      </svg>
    ),
  },
  /* 6 ── Arctic (Citibank Prestige) */
  {
    id: 6,
    label: 'Arctic',
    gradient: 'linear-gradient(145deg,#0a1520 0%,#102840 35%,#1a3d5c 65%,#245070 100%)',
    swatch: '#102840',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          d="M-40 75 C80 48,158 118,278 58 C338 28,382 68,430 48"
          stroke="rgba(80,220,255,0.11)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M-40 96 C80 69,158 139,278 79 C338 49,382 89,430 69"
          stroke="rgba(80,220,255,0.08)"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M-40 117 C80 90,158 160,278 100 C338 70,382 110,430 90"
          stroke="rgba(80,220,255,0.05)"
          strokeWidth="1.5"
          fill="none"
        />
        <polygon
          points="340,178 360,153 380,178 360,203"
          stroke="rgba(150,230,255,0.11)"
          strokeWidth="1"
          fill="rgba(150,230,255,0.04)"
        />
        <polygon
          points="318,192 328,178 338,192 328,206"
          stroke="rgba(150,230,255,0.08)"
          strokeWidth="0.8"
          fill="rgba(150,230,255,0.03)"
        />
        <circle cx="18" cy="28" r="2" fill="rgba(200,240,255,0.20)" />
        <circle cx="48" cy="12" r="1.2" fill="rgba(200,240,255,0.16)" />
      </svg>
    ),
  },
  /* 7 ── Sunset Coral */
  {
    id: 7,
    label: 'Sunset Coral',
    gradient: 'linear-gradient(145deg,#1a0808 0%,#6b1a10 35%,#c2381a 65%,#e8622a 100%)',
    swatch: '#c2381a',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          d="M-20 220 C80 150,160 90,240 130 C300 160,340 110,420 80"
          stroke="rgba(255,180,100,0.12)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M-20 200 C80 130,160 70,240 110 C300 140,340 90,420 60"
          stroke="rgba(255,180,100,0.09)"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M-20 180 C80 110,160 50,240 90 C300 120,340 70,420 40"
          stroke="rgba(255,180,100,0.06)"
          strokeWidth="1.5"
          fill="none"
        />
        <circle
          cx="22"
          cy="22"
          r="48"
          stroke="rgba(255,200,120,0.10)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="22"
          cy="22"
          r="28"
          stroke="rgba(255,200,120,0.08)"
          strokeWidth="1"
          fill="none"
        />
        <circle cx="22" cy="22" r="12" fill="rgba(255,200,120,0.07)" />
      </svg>
    ),
  },
  /* 8 ── Deep Ocean */
  {
    id: 8,
    label: 'Deep Ocean',
    gradient: 'linear-gradient(145deg,#011520 0%,#02304a 35%,#044e72 65%,#086898 100%)',
    swatch: '#02304a',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          d="M0 80 Q95 50,190 80 Q285 110,380 80"
          stroke="rgba(0,200,255,0.09)"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M0 105 Q95 75,190 105 Q285 135,380 105"
          stroke="rgba(0,200,255,0.07)"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M0 130 Q95 100,190 130 Q285 160,380 130"
          stroke="rgba(0,200,255,0.05)"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M0 155 Q95 125,190 155 Q285 185,380 155"
          stroke="rgba(0,200,255,0.04)"
          strokeWidth="1.2"
          fill="none"
        />
        <circle cx="340" cy="30" r="70" stroke="rgba(0,220,255,0.08)" strokeWidth="1" fill="none" />
        <circle cx="340" cy="30" r="45" stroke="rgba(0,220,255,0.06)" strokeWidth="1" fill="none" />
        <circle cx="340" cy="30" r="22" stroke="rgba(0,220,255,0.05)" strokeWidth="1" fill="none" />
      </svg>
    ),
  },
  /* 9 ── Aurora Borealis */
  {
    id: 9,
    label: 'Aurora',
    gradient: 'linear-gradient(135deg,#050e14 0%,#082a1e 30%,#0d3d2a 55%,#1a5c3e 75%,#2d7a5e 100%)',
    swatch: '#082a1e',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          d="M-40 100 C80 40,180 160,320 60 C350 44,370 80,420 55"
          stroke="rgba(0,255,160,0.10)"
          strokeWidth="2.5"
          fill="none"
        />
        <path
          d="M-40 125 C80 65,180 185,320 85 C350 69,370 105,420 80"
          stroke="rgba(60,255,180,0.08)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M-40 150 C80 90,180 210,320 110 C350 94,370 130,420 105"
          stroke="rgba(100,255,200,0.05)"
          strokeWidth="1.5"
          fill="none"
        />
        <ellipse
          cx="80"
          cy="30"
          rx="100"
          ry="28"
          fill="rgba(0,255,150,0.05)"
          transform="rotate(-8,80,30)"
        />
        <ellipse
          cx="280"
          cy="40"
          rx="80"
          ry="20"
          fill="rgba(100,255,180,0.04)"
          transform="rotate(5,280,40)"
        />
        <circle cx="8" cy="18" r="1.5" fill="rgba(200,255,230,0.28)" />
        <circle cx="200" cy="12" r="1" fill="rgba(200,255,230,0.24)" />
        <circle cx="370" cy="22" r="1.5" fill="rgba(200,255,230,0.20)" />
      </svg>
    ),
  },
  /* 10 ── Crimson Silk */
  {
    id: 10,
    label: 'Crimson Silk',
    gradient: 'linear-gradient(145deg,#0f0005 0%,#3a0015 35%,#700028 65%,#a80040 100%)',
    swatch: '#3a0015',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <line
            key={i}
            x1="0"
            y1={i * 24}
            x2="380"
            y2={i * 24}
            stroke="rgba(255,180,200,0.04)"
            strokeWidth="0.5"
          />
        ))}
        <path
          d="M190 -20 C160 60,210 120,170 180 C150 210,120 210,100 220"
          stroke="rgba(255,100,150,0.10)"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M220 -20 C190 60,240 120,200 180 C180 210,150 210,130 220"
          stroke="rgba(255,100,150,0.08)"
          strokeWidth="1.5"
          fill="none"
        />
        <circle
          cx="340"
          cy="180"
          r="90"
          stroke="rgba(255,80,120,0.08)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="340"
          cy="180"
          r="58"
          stroke="rgba(255,80,120,0.06)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="340"
          cy="180"
          r="28"
          stroke="rgba(255,80,120,0.05)"
          strokeWidth="1"
          fill="none"
        />
      </svg>
    ),
  },
  /* 11 ── Titanium */
  {
    id: 11,
    label: 'Titanium',
    gradient: 'linear-gradient(145deg,#0e1014 0%,#1c2028 35%,#2a2e38 65%,#3a4050 100%)',
    swatch: '#1c2028',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
          <line
            key={i}
            x1="0"
            y1={i * 20}
            x2="380"
            y2={i * 20}
            stroke="rgba(255,255,255,0.025)"
            strokeWidth="0.5"
          />
        ))}
        <line x1="0" y1="0" x2="380" y2="220" stroke="rgba(255,255,255,0.04)" strokeWidth="0.7" />
        <line x1="380" y1="0" x2="0" y2="220" stroke="rgba(255,255,255,0.04)" strokeWidth="0.7" />
        <circle
          cx="190"
          cy="110"
          r="140"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="190"
          cy="110"
          r="100"
          stroke="rgba(255,255,255,0.045)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="190"
          cy="110"
          r="60"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="190"
          cy="110"
          r="25"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="0.8"
          fill="none"
        />
      </svg>
    ),
  },
];

const BALANCE_CARD_TEMPLATES: CardTemplate[] = [
  /* 0 ── Indigo */
  {
    id: 0,
    label: 'Indigo',
    gradient: 'linear-gradient(135deg,#1e1b4b 0%,#3730a3 25%,#4f46e5 55%,#6d28d9 85%,#7c3aed 100%)',
    swatch: '#4f46e5',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {[0, 1, 2, 3].map((i) => (
          <polygon
            key={i}
            points="0,-38 33,19 -33,19"
            transform={`translate(${320 - i * 55},${160 - i * 40}) scale(${1.2 + i * 0.6})`}
            stroke="rgba(200,190,255,0.07)"
            strokeWidth="1"
            fill="none"
          />
        ))}
        <circle
          cx="60"
          cy="55"
          r="90"
          stroke="rgba(200,190,255,0.08)"
          strokeWidth="1.2"
          fill="none"
        />
        <circle
          cx="60"
          cy="55"
          r="60"
          stroke="rgba(200,190,255,0.06)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="60"
          cy="55"
          r="30"
          stroke="rgba(200,190,255,0.05)"
          strokeWidth="0.8"
          fill="none"
        />
        <line x1="0" y1="220" x2="380" y2="0" stroke="rgba(200,190,255,0.05)" strokeWidth="0.8" />
        <line x1="40" y1="220" x2="380" y2="40" stroke="rgba(200,190,255,0.04)" strokeWidth="0.8" />
      </svg>
    ),
  },
  /* 1 ── Ocean */
  {
    id: 1,
    label: 'Ocean',
    gradient: 'linear-gradient(135deg,#0c4a6e 0%,#0369a1 40%,#0284c7 70%,#0ea5e9 100%)',
    swatch: '#0369a1',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          d="M-20,80 C60,50 120,110 200,80 C280,50 340,110 420,80"
          stroke="rgba(186,230,255,0.1)"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M-20,110 C60,80 120,140 200,110 C280,80 340,140 420,110"
          stroke="rgba(186,230,255,0.09)"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M-20,140 C60,110 120,170 200,140 C280,110 340,170 420,140"
          stroke="rgba(186,230,255,0.08)"
          strokeWidth="1.2"
          fill="none"
        />
        <circle
          cx="330"
          cy="60"
          r="100"
          stroke="rgba(186,230,255,0.07)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="330"
          cy="60"
          r="65"
          stroke="rgba(186,230,255,0.06)"
          strokeWidth="0.8"
          fill="none"
        />
        <circle
          cx="330"
          cy="60"
          r="30"
          stroke="rgba(186,230,255,0.05)"
          strokeWidth="0.8"
          fill="none"
        />
      </svg>
    ),
  },
  /* 2 ── Forest */
  {
    id: 2,
    label: 'Forest',
    gradient: 'linear-gradient(135deg,#052e16 0%,#166534 35%,#15803d 65%,#16a34a 100%)',
    swatch: '#166534',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          d="M190,0 L340,130 L40,130 Z"
          stroke="rgba(134,239,172,0.07)"
          strokeWidth="1"
          fill="none"
        />
        <path
          d="M190,20 L320,130 L60,130 Z"
          stroke="rgba(134,239,172,0.06)"
          strokeWidth="1"
          fill="none"
        />
        <path
          d="M190,40 L300,130 L80,130 Z"
          stroke="rgba(134,239,172,0.05)"
          strokeWidth="0.8"
          fill="none"
        />
        <circle
          cx="340"
          cy="180"
          r="95"
          stroke="rgba(134,239,172,0.07)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="340"
          cy="180"
          r="60"
          stroke="rgba(134,239,172,0.06)"
          strokeWidth="0.8"
          fill="none"
        />
        <line x1="0" y1="0" x2="380" y2="220" stroke="rgba(134,239,172,0.04)" strokeWidth="0.8" />
        <line x1="60" y1="0" x2="380" y2="160" stroke="rgba(134,239,172,0.03)" strokeWidth="0.8" />
      </svg>
    ),
  },
  /* 3 ── Sunset */
  {
    id: 3,
    label: 'Sunset',
    gradient: 'linear-gradient(135deg,#7c2d12 0%,#c2410c 35%,#ea580c 65%,#fb923c 100%)',
    swatch: '#c2410c',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <line
            key={i}
            x1="190"
            y1="110"
            x2={190 + 200 * Math.cos((i * Math.PI) / 4)}
            y2={110 + 200 * Math.sin((i * Math.PI) / 4)}
            stroke="rgba(254,215,170,0.07)"
            strokeWidth="1"
          />
        ))}
        <circle
          cx="190"
          cy="110"
          r="80"
          stroke="rgba(254,215,170,0.09)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="190"
          cy="110"
          r="52"
          stroke="rgba(254,215,170,0.07)"
          strokeWidth="0.8"
          fill="none"
        />
        <circle
          cx="190"
          cy="110"
          r="25"
          stroke="rgba(254,215,170,0.06)"
          strokeWidth="0.8"
          fill="none"
        />
        <path
          d="M-20,160 C80,130 180,190 380,140"
          stroke="rgba(254,215,170,0.07)"
          strokeWidth="1.2"
          fill="none"
        />
      </svg>
    ),
  },
  /* 4 ── Rose */
  {
    id: 4,
    label: 'Rose',
    gradient: 'linear-gradient(135deg,#4c0519 0%,#9f1239 35%,#be123c 65%,#e11d48 100%)',
    swatch: '#9f1239',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <ellipse
          cx="80"
          cy="110"
          rx="120"
          ry="80"
          stroke="rgba(255,180,200,0.08)"
          strokeWidth="1"
          fill="none"
        />
        <ellipse
          cx="80"
          cy="110"
          rx="80"
          ry="52"
          stroke="rgba(255,180,200,0.07)"
          strokeWidth="1"
          fill="none"
        />
        <ellipse
          cx="80"
          cy="110"
          rx="40"
          ry="26"
          stroke="rgba(255,180,200,0.06)"
          strokeWidth="0.8"
          fill="none"
        />
        <path
          d="M200,0 C240,40 300,80 380,60"
          stroke="rgba(255,180,200,0.07)"
          strokeWidth="1.2"
          fill="none"
        />
        <path
          d="M200,40 C240,80 310,100 380,100"
          stroke="rgba(255,180,200,0.06)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="320"
          cy="60"
          r="70"
          stroke="rgba(255,180,200,0.07)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="320"
          cy="60"
          r="40"
          stroke="rgba(255,180,200,0.05)"
          strokeWidth="0.8"
          fill="none"
        />
      </svg>
    ),
  },
  /* 5 ── Midnight */
  {
    id: 5,
    label: 'Midnight',
    gradient: 'linear-gradient(140deg,#020617 0%,#0f172a 40%,#1e293b 75%,#334155 100%)',
    swatch: '#1e293b',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {[
          [60, 40],
          [140, 80],
          [230, 30],
          [310, 70],
          [80, 140],
          [180, 160],
          [280, 130],
          [350, 170],
          [40, 185],
          [150, 200],
          [260, 190],
        ].map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={i % 3 === 0 ? 1.8 : i % 3 === 1 ? 1.2 : 0.9}
            fill={`rgba(226,232,240,${i % 3 === 0 ? 0.55 : 0.35})`}
          />
        ))}
        <line x1="60" y1="40" x2="140" y2="80" stroke="rgba(226,232,240,0.07)" strokeWidth="0.6" />
        <line x1="140" y1="80" x2="230" y2="30" stroke="rgba(226,232,240,0.06)" strokeWidth="0.6" />
        <line x1="230" y1="30" x2="310" y2="70" stroke="rgba(226,232,240,0.07)" strokeWidth="0.6" />
        <line
          x1="80"
          y1="140"
          x2="180"
          y2="160"
          stroke="rgba(226,232,240,0.06)"
          strokeWidth="0.6"
        />
        <line
          x1="180"
          y1="160"
          x2="280"
          y2="130"
          stroke="rgba(226,232,240,0.06)"
          strokeWidth="0.6"
        />
        <circle
          cx="190"
          cy="110"
          r="130"
          stroke="rgba(226,232,240,0.03)"
          strokeWidth="1"
          fill="none"
        />
      </svg>
    ),
  },
  /* 6 ── Amber */
  {
    id: 6,
    label: 'Amber',
    gradient: 'linear-gradient(135deg,#451a03 0%,#78350f 35%,#b45309 65%,#d97706 100%)',
    swatch: '#b45309',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {[
          [100, 55],
          [170, 55],
          [240, 55],
          [310, 55],
          [65, 110],
          [135, 110],
          [205, 110],
          [275, 110],
          [345, 110],
          [100, 165],
          [170, 165],
          [240, 165],
          [310, 165],
        ].map(([cx, cy], i) => (
          <polygon
            key={i}
            transform={`translate(${cx},${cy})`}
            points="0,-14 12.1,7 -12.1,7"
            stroke="rgba(253,230,138,0.09)"
            strokeWidth="0.8"
            fill="none"
          />
        ))}
        <circle
          cx="340"
          cy="35"
          r="60"
          stroke="rgba(253,230,138,0.08)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="340"
          cy="35"
          r="38"
          stroke="rgba(253,230,138,0.06)"
          strokeWidth="0.8"
          fill="none"
        />
      </svg>
    ),
  },
  /* 7 ── Teal */
  {
    id: 7,
    label: 'Teal',
    gradient: 'linear-gradient(135deg,#042f2e 0%,#134e4a 35%,#0f766e 65%,#0d9488 100%)',
    swatch: '#0f766e',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <circle
          cx="300"
          cy="110"
          r="120"
          stroke="rgba(153,246,228,0.08)"
          strokeWidth="1.2"
          fill="none"
        />
        <circle
          cx="300"
          cy="110"
          r="84"
          stroke="rgba(153,246,228,0.07)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="300"
          cy="110"
          r="50"
          stroke="rgba(153,246,228,0.06)"
          strokeWidth="0.8"
          fill="none"
        />
        <circle
          cx="300"
          cy="110"
          r="22"
          stroke="rgba(153,246,228,0.05)"
          strokeWidth="0.8"
          fill="none"
        />
        <path
          d="M-20,60 C70,40 150,90 230,60 C310,30 370,70 420,50"
          stroke="rgba(153,246,228,0.07)"
          strokeWidth="1.2"
          fill="none"
        />
        <path
          d="M-20,100 C70,80 150,130 230,100 C310,70 370,110 420,90"
          stroke="rgba(153,246,228,0.06)"
          strokeWidth="1"
          fill="none"
        />
      </svg>
    ),
  },
  /* 8 ── Slate */
  {
    id: 8,
    label: 'Slate',
    gradient: 'linear-gradient(145deg,#020617 0%,#1e293b 40%,#334155 75%,#475569 100%)',
    swatch: '#334155',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <line
            key={i}
            x1={i * 47}
            y1="0"
            x2={i * 47}
            y2="220"
            stroke="rgba(203,213,225,0.04)"
            strokeWidth="0.6"
          />
        ))}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1="0"
            y1={i * 55}
            x2="380"
            y2={i * 55}
            stroke="rgba(203,213,225,0.04)"
            strokeWidth="0.6"
          />
        ))}
        <line x1="0" y1="0" x2="380" y2="220" stroke="rgba(203,213,225,0.05)" strokeWidth="0.8" />
        <line x1="380" y1="0" x2="0" y2="220" stroke="rgba(203,213,225,0.05)" strokeWidth="0.8" />
        <circle
          cx="190"
          cy="110"
          r="88"
          stroke="rgba(203,213,225,0.06)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="190"
          cy="110"
          r="52"
          stroke="rgba(203,213,225,0.05)"
          strokeWidth="0.8"
          fill="none"
        />
      </svg>
    ),
  },
  /* 9 ── Violet */
  {
    id: 9,
    label: 'Violet',
    gradient: 'linear-gradient(135deg,#2e1065 0%,#4c1d95 35%,#6d28d9 65%,#8b5cf6 100%)',
    swatch: '#6d28d9',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          d="M-40,110 C40,50 120,170 200,110 C280,50 360,170 440,110"
          stroke="rgba(221,214,254,0.1)"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M-40,80 C40,20 120,140 200,80 C280,20 360,140 440,80"
          stroke="rgba(221,214,254,0.08)"
          strokeWidth="1.2"
          fill="none"
        />
        <path
          d="M-40,140 C40,80 120,200 200,140 C280,80 360,200 440,140"
          stroke="rgba(221,214,254,0.07)"
          strokeWidth="1"
          fill="none"
        />
        {[
          [50, 45, 1.6],
          [200, 25, 1.2],
          [320, 60, 1.8],
          [90, 165, 1.2],
          [260, 175, 1.6],
          [350, 140, 1.0],
        ].map(([cx, cy, r], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r as number}
            fill={`rgba(221,214,254,${i % 2 === 0 ? 0.6 : 0.4})`}
          />
        ))}
        <ellipse
          cx="310"
          cy="150"
          rx="80"
          ry="50"
          stroke="rgba(221,214,254,0.06)"
          strokeWidth="0.8"
          fill="none"
        />
      </svg>
    ),
  },
  /* 10 ── Crimson */
  {
    id: 10,
    label: 'Crimson',
    gradient: 'linear-gradient(145deg,#1a0000 0%,#5b0000 35%,#990000 65%,#cc1111 100%)',
    swatch: '#990000',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <line
            key={i}
            x1="0"
            y1={18 + i * 30}
            x2="380"
            y2={18 + i * 30}
            stroke="rgba(255,200,200,0.05)"
            strokeWidth="0.7"
          />
        ))}
        <path
          d="M-20,160 C60,120 140,180 220,140 C300,100 360,150 420,110"
          stroke="rgba(255,180,180,0.09)"
          strokeWidth="1.2"
          fill="none"
        />
        <path
          d="M-20,120 C60,80 140,140 220,100 C300,60 360,110 420,70"
          stroke="rgba(255,180,180,0.07)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="320"
          cy="55"
          r="88"
          stroke="rgba(255,180,180,0.07)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="320"
          cy="55"
          r="54"
          stroke="rgba(255,180,180,0.05)"
          strokeWidth="0.8"
          fill="none"
        />
        <circle
          cx="320"
          cy="55"
          r="24"
          stroke="rgba(255,180,180,0.04)"
          strokeWidth="0.8"
          fill="none"
        />
      </svg>
    ),
  },
  /* 11 ── Pine */
  {
    id: 11,
    label: 'Pine',
    gradient: 'linear-gradient(145deg,#021a12 0%,#064e3b 35%,#065f46 65%,#047857 100%)',
    swatch: '#065f46',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <line
            key={`v${i}`}
            x1={38 + i * 34}
            y1="0"
            x2={38 + i * 34}
            y2="220"
            stroke="rgba(167,243,208,0.04)"
            strokeWidth="0.6"
          />
        ))}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line
            key={`h${i}`}
            x1="0"
            y1={36 + i * 36}
            x2="380"
            y2={36 + i * 36}
            stroke="rgba(167,243,208,0.04)"
            strokeWidth="0.6"
          />
        ))}
        <circle
          cx="60"
          cy="160"
          r="110"
          stroke="rgba(167,243,208,0.07)"
          strokeWidth="1.2"
          fill="none"
        />
        <circle
          cx="60"
          cy="160"
          r="72"
          stroke="rgba(167,243,208,0.06)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="60"
          cy="160"
          r="38"
          stroke="rgba(167,243,208,0.05)"
          strokeWidth="0.8"
          fill="none"
        />
        <line x1="0" y1="220" x2="380" y2="0" stroke="rgba(167,243,208,0.05)" strokeWidth="0.8" />
      </svg>
    ),
  },
  /* 12 ── Sapphire */
  {
    id: 12,
    label: 'Sapphire',
    gradient: 'linear-gradient(145deg,#0a0a2e 0%,#0d1a6e 35%,#1a3ab8 65%,#2563eb 100%)',
    swatch: '#1a3ab8',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path
            key={i}
            d={`M${-40 + i * 80},0 L${-40 + i * 80 + 110},220`}
            stroke="rgba(147,197,253,0.06)"
            strokeWidth="0.8"
          />
        ))}
        <circle
          cx="330"
          cy="40"
          r="120"
          stroke="rgba(147,197,253,0.08)"
          strokeWidth="1.2"
          fill="none"
        />
        <circle
          cx="330"
          cy="40"
          r="78"
          stroke="rgba(147,197,253,0.07)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="330"
          cy="40"
          r="40"
          stroke="rgba(147,197,253,0.06)"
          strokeWidth="0.8"
          fill="none"
        />
        <ellipse
          cx="60"
          cy="180"
          rx="100"
          ry="60"
          stroke="rgba(147,197,253,0.05)"
          strokeWidth="0.8"
          fill="none"
        />
      </svg>
    ),
  },
  /* 13 ── Lava */
  {
    id: 13,
    label: 'Lava',
    gradient: 'linear-gradient(145deg,#1c0000 0%,#5c1000 30%,#a02000 60%,#e05010 100%)',
    swatch: '#a02000',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          d="M0,180 C60,140 100,200 160,160 C220,120 260,180 320,150 C360,130 380,150 380,150"
          stroke="rgba(255,180,60,0.1)"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M0,150 C80,110 120,170 200,130 C280,90 330,140 380,120"
          stroke="rgba(255,160,40,0.08)"
          strokeWidth="1.2"
          fill="none"
        />
        <circle cx="50" cy="60" r="90" stroke="rgba(255,180,60,0.08)" strokeWidth="1" fill="none" />
        <circle
          cx="50"
          cy="60"
          r="56"
          stroke="rgba(255,160,40,0.07)"
          strokeWidth="0.8"
          fill="none"
        />
        <circle
          cx="50"
          cy="60"
          r="26"
          stroke="rgba(255,140,20,0.06)"
          strokeWidth="0.8"
          fill="none"
        />
      </svg>
    ),
  },
  /* 14 ── Aurora */
  {
    id: 14,
    label: 'Aurora',
    gradient: 'linear-gradient(145deg,#001a1a 0%,#003d3d 30%,#006b5a 60%,#00a878 100%)',
    swatch: '#006b5a',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          d="M-40,70 C60,30 160,100 260,50 C330,20 380,60 420,40"
          stroke="rgba(110,255,210,0.1)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M-40,100 C60,60 160,130 260,80 C330,50 380,90 420,70"
          stroke="rgba(80,230,190,0.08)"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M-40,130 C60,90 160,160 260,110 C330,80 380,120 420,100"
          stroke="rgba(50,200,170,0.06)"
          strokeWidth="1.2"
          fill="none"
        />
        {[
          [60, 50, 1.5],
          [180, 25, 1.0],
          [290, 55, 1.8],
          [350, 80, 1.2],
          [100, 160, 1.0],
          [230, 180, 1.5],
        ].map(([cx, cy, r], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill={`rgba(110,255,210,${i % 2 === 0 ? 0.5 : 0.35})`}
          />
        ))}
      </svg>
    ),
  },
  /* 15 ── Onyx */
  {
    id: 15,
    label: 'Onyx',
    gradient: 'linear-gradient(145deg,#000000 0%,#111111 40%,#1c1c1c 70%,#2a2a2a 100%)',
    swatch: '#1c1c1c',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <line
            key={`d1-${i}`}
            x1={i * 56}
            y1="0"
            x2={i * 56 + 220}
            y2="220"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="0.6"
          />
        ))}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <line
            key={`d2-${i}`}
            x1={380 - i * 56}
            y1="0"
            x2={380 - i * 56 - 220}
            y2="220"
            stroke="rgba(255,255,255,0.025)"
            strokeWidth="0.6"
          />
        ))}
        <circle
          cx="190"
          cy="110"
          r="100"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="190"
          cy="110"
          r="64"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="0.8"
          fill="none"
        />
        <circle
          cx="190"
          cy="110"
          r="30"
          stroke="rgba(255,255,255,0.035)"
          strokeWidth="0.6"
          fill="none"
        />
      </svg>
    ),
  },
  /* 16 ── Cosmos */
  {
    id: 16,
    label: 'Cosmos',
    gradient: 'linear-gradient(145deg,#03001e 0%,#1a0533 35%,#301060 65%,#4b1fa0 100%)',
    swatch: '#301060',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {[
          [30, 25, 1.8],
          [95, 50, 1.0],
          [160, 15, 1.5],
          [220, 45, 1.2],
          [290, 20, 2.0],
          [345, 55, 1.0],
          [55, 110, 1.2],
          [120, 140, 1.8],
          [200, 100, 1.0],
          [270, 130, 1.5],
          [340, 105, 1.2],
          [40, 185, 1.0],
          [150, 195, 1.8],
          [250, 170, 1.0],
          [330, 190, 1.5],
        ].map(([cx, cy, r], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill={`rgba(216,180,254,${r > 1.5 ? 0.65 : 0.4})`}
          />
        ))}
        <ellipse
          cx="260"
          cy="145"
          rx="140"
          ry="85"
          stroke="rgba(216,180,254,0.06)"
          strokeWidth="1"
          fill="none"
          transform="rotate(-15,260,145)"
        />
        <ellipse
          cx="260"
          cy="145"
          rx="90"
          ry="55"
          stroke="rgba(216,180,254,0.05)"
          strokeWidth="0.8"
          fill="none"
          transform="rotate(-15,260,145)"
        />
      </svg>
    ),
  },
  /* 17 ── Copper */
  {
    id: 17,
    label: 'Copper',
    gradient: 'linear-gradient(145deg,#1a0800 0%,#4a1a00 35%,#8b3a00 65%,#c25a10 100%)',
    swatch: '#8b3a00',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <circle
          cx="280"
          cy="110"
          r="130"
          stroke="rgba(251,191,36,0.08)"
          strokeWidth="1.2"
          fill="none"
        />
        <circle
          cx="280"
          cy="110"
          r="90"
          stroke="rgba(251,191,36,0.07)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="280"
          cy="110"
          r="55"
          stroke="rgba(251,191,36,0.06)"
          strokeWidth="0.8"
          fill="none"
        />
        <circle
          cx="280"
          cy="110"
          r="26"
          stroke="rgba(251,191,36,0.05)"
          strokeWidth="0.8"
          fill="none"
        />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <line
            key={i}
            x1="0"
            y1={10 + i * 28}
            x2="380"
            y2={10 + i * 28}
            stroke="rgba(251,191,36,0.04)"
            strokeWidth="0.6"
          />
        ))}
      </svg>
    ),
  },
  /* 18 ── Dusk */
  {
    id: 18,
    label: 'Dusk',
    gradient: 'linear-gradient(145deg,#0f0020 0%,#2d0a5e 30%,#6b21a8 60%,#c026d3 100%)',
    swatch: '#6b21a8',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          d="M-40,150 C40,80 140,180 240,100 C310,50 370,120 420,90"
          stroke="rgba(240,171,252,0.1)"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M-40,110 C40,40 140,140 240,60 C310,10 370,80 420,50"
          stroke="rgba(240,171,252,0.07)"
          strokeWidth="1.2"
          fill="none"
        />
        <circle
          cx="60"
          cy="55"
          r="80"
          stroke="rgba(240,171,252,0.08)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="60"
          cy="55"
          r="50"
          stroke="rgba(240,171,252,0.06)"
          strokeWidth="0.8"
          fill="none"
        />
        <circle
          cx="60"
          cy="55"
          r="25"
          stroke="rgba(240,171,252,0.05)"
          strokeWidth="0.8"
          fill="none"
        />
        {[
          [310, 55, 1.5],
          [350, 90, 1.0],
          [340, 25, 1.2],
          [280, 75, 0.8],
        ].map(([cx, cy, r], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill={`rgba(240,171,252,${r > 1.2 ? 0.55 : 0.35})`}
          />
        ))}
      </svg>
    ),
  },
  /* 19 ── Arctic */
  {
    id: 19,
    label: 'Arctic',
    gradient: 'linear-gradient(145deg,#e8f4ff 0%,#c8e4f8 30%,#a0ccee 60%,#6eaad6 100%)',
    swatch: '#6eaad6',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <polygon
            key={i}
            points={`${80 + i * 52},${20} ${80 + i * 52 + 26},${65} ${80 + i * 52 - 26},${65}`}
            stroke="rgba(30,80,130,0.08)"
            strokeWidth="0.8"
            fill="none"
          />
        ))}
        <circle
          cx="340"
          cy="170"
          r="100"
          stroke="rgba(30,80,130,0.07)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="340"
          cy="170"
          r="64"
          stroke="rgba(30,80,130,0.06)"
          strokeWidth="0.8"
          fill="none"
        />
        <circle
          cx="340"
          cy="170"
          r="30"
          stroke="rgba(30,80,130,0.05)"
          strokeWidth="0.8"
          fill="none"
        />
        <line x1="0" y1="120" x2="380" y2="120" stroke="rgba(30,80,130,0.06)" strokeWidth="0.7" />
        <line x1="0" y1="150" x2="380" y2="150" stroke="rgba(30,80,130,0.05)" strokeWidth="0.6" />
      </svg>
    ),
  },
];

const MC_TEMPLATES: CardTemplate[] = [
  /* 0 ── Obsidian */
  {
    id: 0,
    label: 'Obsidian',
    gradient: 'linear-gradient(135deg,#0c0c12 0%,#171724 50%,#222236 100%)',
    swatch: '#171724',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <line x1="0" y1="0" x2="380" y2="220" stroke="rgba(255,255,255,0.035)" strokeWidth="0.8" />
        <line x1="380" y1="0" x2="0" y2="220" stroke="rgba(255,255,255,0.035)" strokeWidth="0.8" />
        <circle
          cx="348"
          cy="178"
          r="108"
          stroke="rgba(255,255,255,0.045)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="348"
          cy="178"
          r="78"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="348"
          cy="178"
          r="48"
          stroke="rgba(255,255,255,0.035)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="348"
          cy="178"
          r="22"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="0.8"
          fill="none"
        />
      </svg>
    ),
  },
  /* 1 ── Glacier */
  {
    id: 1,
    label: 'Glacier',
    gradient: 'linear-gradient(145deg,#0f1e2e 0%,#1a3048 35%,#244560 65%,#2e5a78 100%)',
    swatch: '#1a3048',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <circle
          cx="78"
          cy="78"
          r="128"
          stroke="rgba(160,220,255,0.09)"
          strokeWidth="1.5"
          fill="none"
        />
        <circle
          cx="78"
          cy="78"
          r="96"
          stroke="rgba(160,220,255,0.08)"
          strokeWidth="1.2"
          fill="none"
        />
        <circle
          cx="78"
          cy="78"
          r="64"
          stroke="rgba(160,220,255,0.07)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="78"
          cy="78"
          r="32"
          stroke="rgba(160,220,255,0.06)"
          strokeWidth="0.8"
          fill="none"
        />
        <line x1="198" y1="0" x2="380" y2="182" stroke="rgba(160,220,255,0.06)" strokeWidth="0.8" />
        <line x1="238" y1="0" x2="380" y2="142" stroke="rgba(160,220,255,0.05)" strokeWidth="0.8" />
        <line x1="278" y1="0" x2="380" y2="102" stroke="rgba(160,220,255,0.04)" strokeWidth="0.8" />
      </svg>
    ),
  },
  /* 2 ── Inferno */
  {
    id: 2,
    label: 'Inferno',
    gradient: 'linear-gradient(145deg,#1a0000 0%,#4a0808 35%,#880a0a 65%,#b81010 100%)',
    swatch: '#4a0808',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          d="M-20 220 C40 182,82 122,102 142 C122 162,142 82,182 62"
          stroke="rgba(255,150,50,0.11)"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M-20 220 C62 192,102 132,132 152 C162 172,192 92,232 72"
          stroke="rgba(255,100,30,0.09)"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M62 220 C122 182,162 122,192 142 C212 162,242 82,282 52"
          stroke="rgba(255,180,80,0.07)"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M130 220 C190 178,232 118,262 138 C290 158,320 75,355 40"
          stroke="rgba(255,120,40,0.06)"
          strokeWidth="1.5"
          fill="none"
        />
        <circle
          cx="322"
          cy="38"
          r="72"
          stroke="rgba(255,100,50,0.07)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="322"
          cy="38"
          r="46"
          stroke="rgba(255,100,50,0.06)"
          strokeWidth="1"
          fill="none"
        />
      </svg>
    ),
  },
  /* 3 ── Royal Navy */
  {
    id: 3,
    label: 'Royal Navy',
    gradient: 'linear-gradient(145deg,#060d20 0%,#0b1a40 35%,#122860 65%,#1a388a 100%)',
    swatch: '#0b1a40',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          d="M28 110 L58 80 L88 110 L58 140 Z"
          stroke="rgba(100,150,255,0.09)"
          strokeWidth="1"
          fill="none"
        />
        <path
          d="M88 60 L118 30 L148 60 L118 90 Z"
          stroke="rgba(100,150,255,0.08)"
          strokeWidth="1"
          fill="none"
        />
        <path
          d="M148 110 L178 80 L208 110 L178 140 Z"
          stroke="rgba(100,150,255,0.08)"
          strokeWidth="1"
          fill="none"
        />
        <path
          d="M268 80 L298 50 L328 80 L298 110 Z"
          stroke="rgba(100,150,255,0.08)"
          strokeWidth="1"
          fill="none"
        />
        <path
          d="M298 140 L328 110 L358 140 L328 170 Z"
          stroke="rgba(100,150,255,0.07)"
          strokeWidth="1"
          fill="none"
        />
        <path
          d="M88 160 L118 130 L148 160 L118 190 Z"
          stroke="rgba(100,150,255,0.07)"
          strokeWidth="1"
          fill="none"
        />
        <path
          d="M208 30 L238 0 L268 30 L238 60 Z"
          stroke="rgba(100,150,255,0.06)"
          strokeWidth="1"
          fill="none"
        />
        <line x1="0" y1="110" x2="380" y2="110" stroke="rgba(100,150,255,0.05)" strokeWidth="0.5" />
      </svg>
    ),
  },
  /* 4 ── Platinum */
  {
    id: 4,
    label: 'Platinum',
    gradient: 'linear-gradient(145deg,#1a1a20 0%,#2d2d38 35%,#424252 65%,#585870 100%)',
    swatch: '#2d2d38',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <line
            key={i}
            x1="0"
            y1={i * 22}
            x2="380"
            y2={i * 22}
            stroke="rgba(255,255,255,0.028)"
            strokeWidth="0.5"
          />
        ))}
        <circle
          cx="328"
          cy="110"
          r="105"
          stroke="rgba(255,255,255,0.055)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="328"
          cy="110"
          r="75"
          stroke="rgba(255,255,255,0.048)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="328"
          cy="110"
          r="45"
          stroke="rgba(255,255,255,0.042)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="328"
          cy="110"
          r="18"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="0.8"
          fill="none"
        />
      </svg>
    ),
  },
  /* 5 ── Emerald Isle */
  {
    id: 5,
    label: 'Emerald Isle',
    gradient: 'linear-gradient(145deg,#011810 0%,#033820 35%,#065c34 65%,#0a8050 100%)',
    swatch: '#033820',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          d="M0 160 Q95 120,190 160 Q285 200,380 160"
          stroke="rgba(0,220,120,0.09)"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M0 138 Q95 98,190 138 Q285 178,380 138"
          stroke="rgba(0,220,120,0.07)"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M0 116 Q95 76,190 116 Q285 156,380 116"
          stroke="rgba(0,220,120,0.05)"
          strokeWidth="1.2"
          fill="none"
        />
        <circle cx="50" cy="50" r="75" stroke="rgba(0,220,120,0.08)" strokeWidth="1" fill="none" />
        <circle cx="50" cy="50" r="48" stroke="rgba(0,220,120,0.06)" strokeWidth="1" fill="none" />
        <circle cx="50" cy="50" r="24" stroke="rgba(0,220,120,0.05)" strokeWidth="1" fill="none" />
        <circle cx="330" cy="40" r="2" fill="rgba(0,255,140,0.20)" />
        <circle cx="358" cy="20" r="1.2" fill="rgba(0,255,140,0.16)" />
      </svg>
    ),
  },
  /* 6 ── Midnight Violet */
  {
    id: 6,
    label: 'Midnight Violet',
    gradient: 'linear-gradient(145deg,#0d0020 0%,#220040 35%,#3e0070 65%,#5800a0 100%)',
    swatch: '#220040',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          d="M-40 110 C60 60,180 170,300 90 C340 66,375 100,420 80"
          stroke="rgba(180,100,255,0.11)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M-40 135 C60 85,180 195,300 115 C340 91,375 125,420 105"
          stroke="rgba(180,100,255,0.08)"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M-40 160 C60 110,180 220,300 140 C340 116,375 150,420 130"
          stroke="rgba(180,100,255,0.05)"
          strokeWidth="1.2"
          fill="none"
        />
        <circle cx="20" cy="20" r="1.5" fill="rgba(220,150,255,0.30)" />
        <circle cx="80" cy="38" r="1" fill="rgba(220,150,255,0.24)" />
        <circle cx="180" cy="15" r="1.8" fill="rgba(220,150,255,0.28)" />
        <circle cx="300" cy="30" r="1" fill="rgba(220,150,255,0.22)" />
        <circle cx="355" cy="10" r="1.5" fill="rgba(220,150,255,0.26)" />
        <ellipse cx="190" cy="175" rx="100" ry="30" fill="rgba(120,0,200,0.07)" />
      </svg>
    ),
  },
  /* 7 ── Copper Rose */
  {
    id: 7,
    label: 'Copper Rose',
    gradient: 'linear-gradient(145deg,#1a0a06 0%,#4a1a0a 35%,#8a3c18 65%,#c05828 100%)',
    swatch: '#4a1a0a',
    patternEl: (
      <svg
        className="cp-pattern"
        viewBox="0 0 380 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <circle
          cx="300"
          cy="80"
          r="120"
          stroke="rgba(255,160,100,0.10)"
          strokeWidth="1.5"
          fill="none"
        />
        <circle
          cx="300"
          cy="80"
          r="88"
          stroke="rgba(255,160,100,0.08)"
          strokeWidth="1.2"
          fill="none"
        />
        <circle
          cx="300"
          cy="80"
          r="58"
          stroke="rgba(255,160,100,0.06)"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="300"
          cy="80"
          r="30"
          stroke="rgba(255,160,100,0.05)"
          strokeWidth="0.8"
          fill="none"
        />
        <line x1="-20" y1="220" x2="220" y2="0" stroke="rgba(255,160,100,0.07)" strokeWidth="0.9" />
        <line x1="20" y1="220" x2="260" y2="0" stroke="rgba(255,160,100,0.05)" strokeWidth="0.9" />
        <line x1="60" y1="220" x2="300" y2="0" stroke="rgba(255,160,100,0.04)" strokeWidth="0.9" />
        <circle cx="18" cy="195" r="2" fill="rgba(255,180,120,0.18)" />
        <circle cx="362" cy="195" r="2" fill="rgba(255,180,120,0.18)" />
      </svg>
    ),
  },
];

const VN_BANKS = [
  { id: 'vcb', name: 'Vietcombank', short: 'VCB', color: '#007A3D', bg: '#E8F5EC' },
  { id: 'bidv', name: 'BIDV', short: 'BIDV', color: '#1B4B9B', bg: '#E8EAF6' },
  { id: 'tcb', name: 'Techcombank', short: 'TCB', color: '#DC1D1D', bg: '#FFEBEE' },
  { id: 'vpb', name: 'VPBank', short: 'VPB', color: '#00854A', bg: '#E8F5EC' },
  { id: 'mbb', name: 'MB Bank', short: 'MB', color: '#B8272A', bg: '#FFEBEE' },
  { id: 'vba', name: 'Agribank', short: 'AGB', color: '#C8A500', bg: '#FFFDE7' },
  { id: 'acb', name: 'ACB', short: 'ACB', color: '#0066CC', bg: '#E3F2FD' },
  { id: 'stb', name: 'Sacombank', short: 'STB', color: '#EF3E32', bg: '#FFEBEE' },
  { id: 'tpb', name: 'TPBank', short: 'TPB', color: '#FF6600', bg: '#FFF3E0' },
  { id: 'vtb', name: 'VietinBank', short: 'VTB', color: '#1A3E7A', bg: '#E8EAF6' },
  { id: 'ocb', name: 'OCB', short: 'OCB', color: '#00A3D1', bg: '#E0F7FA' },
  { id: 'shb', name: 'SHB', short: 'SHB', color: '#DC0025', bg: '#FFEBEE' },
] as const;

/* ── Vietnamese bank logo images from vietqr.io CDN ── */
const BANK_VIETQR_CODE: Record<string, string> = {
  vcb: 'VCB',
  bidv: 'BIDV',
  tcb: 'TCB',
  vpb: 'VPB',
  mbb: 'MB',
  vba: 'VBA',
  acb: 'ACB',
  stb: 'STB',
  tpb: 'TPB',
  vtb: 'ICB',
  ocb: 'OCB',
  shb: 'SHB',
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const BankLogoSVG = ({ id, color: _color }: { id: string; color: string }) => {
  const code = BANK_VIETQR_CODE[id] ?? id.toUpperCase();
  return (
    <img
      src={`https://cdn.vietqr.io/img/${code}.png`}
      alt={id}
      width="34"
      height="34"
      style={{ objectFit: 'contain', display: 'block' }}
    />
  );
};

const PayOSLogo = () => (
  <svg width="42" height="22" viewBox="0 0 42 22" fill="none">
    <rect width="42" height="22" rx="5" fill="#0052CC" />
    <text
      x="21"
      y="15"
      textAnchor="middle"
      fill="white"
      fontSize="9"
      fontWeight="800"
      fontFamily="system-ui,sans-serif"
    >
      PayOS
    </text>
  </svg>
);

const VisaLogo = () => (
  <svg width="42" height="22" viewBox="0 0 42 22" fill="none">
    <rect width="42" height="22" rx="5" fill="#1A1F71" />
    <text
      x="21"
      y="16"
      textAnchor="middle"
      fill="white"
      fontSize="13"
      fontWeight="800"
      fontFamily="serif"
      fontStyle="italic"
    >
      VISA
    </text>
  </svg>
);

const MastercardLogo = () => (
  <svg width="44" height="28" viewBox="0 0 44 28" fill="none">
    <circle cx="16" cy="14" r="10" fill="#EB001B" />
    <circle cx="28" cy="14" r="10" fill="#F79E1B" />
    <path d="M 22 6 A 10 10 0 0 1 22 22 A 10 10 0 0 0 22 6 Z" fill="#FF5F00" />
  </svg>
);

const PAGE_SIZE = 5;

const STATUS_TO_API: Record<Exclude<TransactionStatusFilter, 'all'>, string> = {
  completed: 'SUCCESS',
  pending: 'PENDING',
  failed: 'FAILED',
  cancelled: 'CANCELLED',
};

/** Map BE enum → FE display status */
const TX_STATUS_MAP: Record<TransactionStatus, Exclude<TransactionStatusFilter, 'all'>> = {
  PENDING: 'pending',
  PROCESSING: 'pending',
  SUCCESS: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

const API_PAGE_SIZE = 20;

/** Countdown clock for a PENDING transaction — reads expiresAt from BE */
const TxCountdown = ({ expiresAt }: { expiresAt: string }) => {
  const calc = () => Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  const [remaining, setRemaining] = useState(calc);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining(calc), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);

  if (remaining <= 0) return <span className="tx-countdown tx-countdown--expired">Hết hạn</span>;

  const mm = Math.floor(remaining / 60)
    .toString()
    .padStart(2, '0');
  const ss = (remaining % 60).toString().padStart(2, '0');
  return (
    <span className="tx-countdown">
      {mm}:{ss}
    </span>
  );
};

const StudentWallet: React.FC = () => {
  const currentRole = AuthService.getUserRole() || 'student';

  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [walletLoading, setWalletLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDismissed, setErrorDismissed] = useState(false);

  const [amount, setAmount] = useState(100_000);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('payos');
  const [depositing, setDepositing] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPendingWarning, setShowPendingWarning] = useState(false);
  const [showTplModal, setShowTplModal] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardFlipped, setCardFlipped] = useState(false);
  const [cardTemplate, setCardTemplate] = useState(0);
  const [realFullName, setRealFullName] = useState<string | null>(null);
  const [balanceCardFlipped, setBalanceCardFlipped] = useState(false);
  const [balanceCardTemplate, setBalanceCardTemplate] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TransactionStatusFilter>('all');
  const [page, setPage] = useState(1);

  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const currentUser =
    currentRole === 'teacher' ? mockTeacher : currentRole === 'admin' ? mockAdmin : mockStudent;

  const layoutRole: 'teacher' | 'student' | 'admin' =
    currentRole === 'teacher' ? 'teacher' : currentRole === 'admin' ? 'admin' : 'student';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const normalizeStatus = (status?: string): Exclude<TransactionStatusFilter, 'all'> =>
    TX_STATUS_MAP[(status as TransactionStatus) ?? ''] ?? 'failed';

  const normalizeType = (tx: WalletTransaction): 'deposit' | 'payment' => {
    if (tx.type === 'DEPOSIT') return 'deposit';
    if (tx.type === 'PAYMENT' || tx.type === 'WITHDRAWAL') return 'payment';
    return tx.amount >= 0 ? 'deposit' : 'payment';
  };

  const formatDate = (raw?: string | null): { day: string; time: string } => {
    if (!raw) return { day: '-', time: '-' };
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return { day: '-', time: '-' };
    const full = date.toLocaleString('vi-VN');
    const [day = '-', time = '-'] = full.split(' ');
    return { day, time };
  };

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -10, y: x * 12 });
  };

  const handleCardMouseLeave = () => setTilt({ x: 0, y: 0 });

  const getTransactionCode = (tx: WalletTransaction) => {
    if (tx.orderCode) return String(tx.orderCode);
    if (tx.transactionId) return tx.transactionId.slice(-8).toUpperCase();
    return 'N/A';
  };

  const loadWallet = async () => {
    try {
      setWalletLoading(true);
      const response = await WalletService.getMyWallet();
      setWallet(response.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải ví');
      setErrorDismissed(false);
    } finally {
      setWalletLoading(false);
    }
  };

  const loadTransactions = useCallback(async (filter: TransactionStatusFilter) => {
    try {
      setTransactionsLoading(true);
      setError(null);
      setErrorDismissed(false);

      const response =
        filter === 'all'
          ? await WalletService.getTransactions({ page: 0, size: API_PAGE_SIZE })
          : await WalletService.getTransactionsByStatus(STATUS_TO_API[filter], {
              page: 0,
              size: API_PAGE_SIZE,
            });

      // BE always returns Spring Page object — `content` is always present
      setTransactions(response.result.content ?? []);
      setPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải giao dịch');
      setErrorDismissed(false);
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWallet();
    UserService.getMyInfo()
      .then((info) => setRealFullName(info.fullName || info.userName || null))
      .catch(() => {
        /* silently fall back to mock name */
      });
  }, []);

  useEffect(() => {
    void loadTransactions(statusFilter);
  }, [statusFilter, loadTransactions]);

  // Clean up any in-flight poll timer on unmount
  useEffect(
    () => () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    },
    []
  );

  const filteredTransactions = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return transactions;

    return transactions.filter((tx) => {
      const code = getTransactionCode(tx).toLowerCase();
      const text = (tx.description ?? '').toLowerCase();
      return code.includes(keyword) || text.includes(keyword);
    });
  }, [searchTerm, transactions]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const paginatedTransactions = filteredTransactions.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );
  const displayStart = filteredTransactions.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const displayEnd = Math.min(safePage * PAGE_SIZE, filteredTransactions.length);

  // Use BE-provided all-time total (wallet.totalDeposited) — no client-side calculation
  const totalDeposit = wallet?.totalDeposited ?? 0;

  // Resolve active card template for Visa/MC preview
  const _activeTpls = selectedMethod === 'visa' ? VISA_TEMPLATES : MC_TEMPLATES;
  const _cardTpl = _activeTpls[Math.min(cardTemplate, _activeTpls.length - 1)];

  const handleDeposit = async () => {
    if (amount < 10000) {
      setError('Số tiền nạp tối thiểu là 10.000 VND');
      setErrorDismissed(false);
      return;
    }

    try {
      setDepositing(true);
      setError(null);

      const methodLabel = PAYMENT_METHODS.find((m) => m.id === selectedMethod)?.name ?? 'PayOS';

      const response = await WalletService.deposit({
        amount,
        description: `Nạp tiền MathMaster qua ${methodLabel}`,
      });

      const { checkoutUrl, orderCode } = response.result;
      window.open(checkoutUrl, '_blank', 'noopener,noreferrer');

      // Immediately refresh transaction list so the new PENDING tx appears at the top
      await loadTransactions(statusFilter);

      setDepositSuccess(true);
      setTimeout(() => setDepositSuccess(false), 3000);

      // Poll order status every 5s (max 3 minutes = 36 attempts)
      let attempts = 0;
      const MAX_ATTEMPTS = 36;
      const poll = async () => {
        if (attempts >= MAX_ATTEMPTS) return;
        attempts++;
        try {
          const statusRes = await WalletService.getOrderStatus(orderCode);
          const txStatus = statusRes.result.status;
          if (txStatus === 'SUCCESS') {
            await Promise.all([loadWallet(), loadTransactions(statusFilter)]);
            return;
          }
          if (txStatus === 'FAILED' || txStatus === 'CANCELLED') {
            setError(
              txStatus === 'CANCELLED'
                ? 'Giao dịch đã bị hủy hoặc hết hạn.'
                : 'Thanh toán thất bại. Vui lòng thử lại.'
            );
            setErrorDismissed(false);
            await loadTransactions(statusFilter);
            return;
          }
        } catch {
          // network error — keep polling
        }
        pollTimerRef.current = setTimeout(() => void poll(), 5000);
      };
      void poll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo thanh toán');
      setErrorDismissed(false);
    } finally {
      setDepositing(false);
    }
  };

  const handleDepositClick = () => {
    if (amount < 10_000) {
      setError('Số tiền nạp tối thiểu là 10.000 VND');
      setErrorDismissed(false);
      return;
    }
    if (selectedMethod !== 'payos') {
      setError('Phương thức này đang được phát triển. Vui lòng sử dụng PayOS.');
      setErrorDismissed(false);
      return;
    }
    // Warn if a PENDING transaction already exists
    const hasPending = transactions.some(
      (tx) => tx.status === 'PENDING' || tx.status === 'PROCESSING'
    );
    if (hasPending) {
      setShowPendingWarning(true);
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmDeposit = () => {
    setShowConfirmModal(false);
    void handleDeposit();
  };

  const formatCardNumber = (val: string) =>
    val
      .replace(/\D/g, '')
      .slice(0, 16)
      .replace(/(.{4})/g, '$1 ')
      .trim();

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  };

  const exportCsv = () => {
    const rows = filteredTransactions.map((tx) => [
      tx.createdAt || '',
      getTransactionCode(tx),
      normalizeType(tx) === 'deposit' ? 'Nạp tiền' : 'Thanh toán',
      tx.amount.toString(),
      normalizeStatus(tx.status),
    ]);

    const csv = [['Ngay giao dich', 'Ma giao dich', 'Loai', 'So tien', 'Trang thai'], ...rows]
      .map((line) => line.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wallet-transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <DashboardLayout
        role={layoutRole}
        user={{ name: currentUser.name, avatar: currentUser.avatar!, role: layoutRole }}
        notificationCount={5}
      >
        <div className="wallet-page">
          {/* Header */}
          <header className="wallet-header">
            <div>
              <h1>Ví của tôi</h1>
              <p>Quản lý số dư và theo dõi lịch sử giao dịch</p>
            </div>
            <button className="btn-report" onClick={exportCsv}>
              <Download size={15} /> Xuất báo cáo
            </button>
          </header>

          {/* Error Banner */}
          {error && !errorDismissed && (
            <div className="wallet-error-banner" role="alert">
              <AlertTriangle size={17} />
              <span>{error}</span>
              <button className="error-dismiss" onClick={() => setErrorDismissed(true)}>
                <X size={15} />
              </button>
            </div>
          )}

          {/* Stat Strip */}
          <div className="wallet-stat-strip">
            <div className="wallet-stat-item">
              <span className="wallet-stat-label">Số dư hiện tại</span>
              <span className="wallet-stat-value wallet-stat-value--primary">
                {walletLoading ? '—' : `${formatCurrency(wallet?.balance ?? 0)} ₫`}
              </span>
            </div>
            <div className="wallet-stat-divider" />
            <div className="wallet-stat-item">
              <span className="wallet-stat-label">Tổng đã nạp</span>
              <span className="wallet-stat-value wallet-stat-value--green">
                {walletLoading ? '—' : `${formatCurrency(totalDeposit)} ₫`}
              </span>
            </div>
            <div className="wallet-stat-divider" />
            <div className="wallet-stat-item">
              <span className="wallet-stat-label">Số giao dịch</span>
              <span className="wallet-stat-value">
                {walletLoading ? '—' : (wallet?.transactionCount ?? transactions.length)}
              </span>
            </div>
          </div>

          {/* Overview Grid */}
          <section className="wallet-overview">
            {/* Glassmorphism Balance Card — flippable */}
            <div className="balance-card-section">
              {/* Template picker */}
              <div className="balance-card-tpl-picker">
                {BALANCE_CARD_TEMPLATES.slice(0, 6).map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    className={`card-tpl-swatch${balanceCardTemplate === tpl.id ? ' active' : ''}`}
                    style={{ background: tpl.swatch }}
                    title={tpl.label}
                    onClick={() => {
                      setBalanceCardTemplate(tpl.id);
                      setBalanceCardFlipped(false);
                    }}
                  />
                ))}
                <button
                  type="button"
                  className="bc-tpl-more-btn"
                  title="Xem thêm mẫu"
                  onClick={() => setShowTplModal(true)}
                >
                  {balanceCardTemplate >= 6 ? (
                    <span
                      className="bc-tpl-more-dot"
                      style={{ background: BALANCE_CARD_TEMPLATES[balanceCardTemplate].swatch }}
                    />
                  ) : (
                    '···'
                  )}
                </button>
                <span className="card-tpl-hint">Chọn mẫu</span>
              </div>

              {/* Flip outer — tilt effect + click to flip */}
              <div
                ref={cardRef}
                className="balance-card-flip-outer"
                style={{
                  transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(0)`,
                }}
                onMouseMove={handleCardMouseMove}
                onMouseLeave={handleCardMouseLeave}
                onClick={() => setBalanceCardFlipped((f) => !f)}
              >
                <div className={`balance-card-flipper${balanceCardFlipped ? ' flipped' : ''}`}>
                  {/* ── FRONT FACE ── */}
                  <div
                    className="balance-card balance-card--face"
                    style={{
                      background: BALANCE_CARD_TEMPLATES[balanceCardTemplate].gradient,
                    }}
                  >
                    {BALANCE_CARD_TEMPLATES[balanceCardTemplate].patternEl}
                    <div className="card-noise" aria-hidden="true" />
                    <div className="card-light" aria-hidden="true" />
                    <div className="card-top-row">
                      <div className="card-mc-rings" aria-hidden="true">
                        <span className="ring-left" />
                        <span className="ring-right" />
                      </div>
                      <div className="card-chip" aria-hidden="true" />
                    </div>

                    <div className="card-balance-section">
                      <div className="card-balance-label">Số dư khả dụng</div>
                      {walletLoading ? (
                        <div className="card-balance-skeleton" />
                      ) : (
                        <div className="card-balance-value">
                          {formatCurrency(wallet?.balance ?? 0)}
                          <span className="card-balance-currency"> VND</span>
                        </div>
                      )}
                    </div>

                    <div className="card-footer-row">
                      <div>
                        <div className="card-number">**** **** **** 2048</div>
                        <div className="card-holder">
                          {(realFullName ?? currentUser.name ?? 'MATHMASTER USER').toUpperCase()}
                        </div>
                      </div>
                      <div className="card-updated bc-front-hint">Nhấn để xem mặt sau</div>
                    </div>
                  </div>

                  {/* ── BACK FACE ── */}
                  <div
                    className="balance-card balance-card--face balance-card--back"
                    style={{
                      background: BALANCE_CARD_TEMPLATES[balanceCardTemplate].gradient,
                    }}
                  >
                    {BALANCE_CARD_TEMPLATES[balanceCardTemplate].patternEl}
                    <div className="card-noise" aria-hidden="true" />
                    {/* Magnetic stripe */}
                    <div className="bc-mag-stripe" aria-hidden="true" />
                    {/* Stats */}
                    <div className="bc-back-stats">
                      <div className="bc-back-stat">
                        <span className="bc-back-stat__label">Tổng đã nạp</span>
                        <span className="bc-back-stat__val">
                          {walletLoading ? '—' : `${formatCurrency(totalDeposit)} ₫`}
                        </span>
                      </div>
                      <div className="bc-back-stat">
                        <span className="bc-back-stat__label">Giao dịch</span>
                        <span className="bc-back-stat__val">
                          {walletLoading ? '—' : (wallet?.transactionCount ?? transactions.length)}
                        </span>
                      </div>
                      <div className="bc-back-stat">
                        <span className="bc-back-stat__label">Số dư</span>
                        <span className="bc-back-stat__val">
                          {walletLoading ? '—' : `${formatCurrency(wallet?.balance ?? 0)} ₫`}
                        </span>
                      </div>
                    </div>
                    {/* Footer */}
                    <div className="bc-back-footer">
                      <span className="bc-back-hint">Nhấn để xem mặt trước</span>
                      <span className="bc-back-brand">MathMaster</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top-up Action Card */}
            <article className="wallet-topup-card">
              <div className="topup-header">
                <Zap size={19} className="topup-zap" />
                <h2>Nạp tiền nhanh</h2>
              </div>

              {/* Payment Method Selector */}
              <div className="method-selector">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.id}
                    className={`method-card${selectedMethod === m.id ? ' selected' : ''}`}
                    onClick={() => {
                      setSelectedMethod(m.id);
                      setSelectedBank(null);
                      setCardFlipped(false);
                      setCardTemplate(0);
                    }}
                  >
                    <div className="method-logo">
                      {m.id === 'payos' && <PayOSLogo />}
                      {m.id === 'visa' && <VisaLogo />}
                      {m.id === 'mastercard' && <MastercardLogo />}
                    </div>
                    <div className="method-name">{m.name}</div>
                    <div className="method-sub">{m.sub}</div>
                  </button>
                ))}
              </div>

              {/* ── PayOS: Bank selector ── */}
              {selectedMethod === 'payos' && (
                <div className="payos-section">
                  <div className="payos-section__header">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="1" y="4" width="22" height="16" rx="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                    <span>
                      Ngân hàng của bạn <span className="payos-section__optional">(tùy chọn)</span>
                    </span>
                  </div>
                  <div className="bank-grid">
                    {VN_BANKS.map((bank) => (
                      <button
                        key={bank.id}
                        type="button"
                        className={`bank-chip${selectedBank === bank.id ? ' selected' : ''}`}
                        style={
                          selectedBank === bank.id
                            ? {
                                borderColor: bank.color,
                                boxShadow: `0 0 0 2px ${bank.color}30`,
                                background: `${bank.color}08`,
                              }
                            : {}
                        }
                        onClick={() => setSelectedBank(selectedBank === bank.id ? null : bank.id)}
                      >
                        <div
                          className="bank-chip__icon"
                          style={{ background: '#fff', border: `1.5px solid ${bank.color}25` }}
                        >
                          <BankLogoSVG id={bank.id} color={bank.color} />
                        </div>
                        <span className="bank-chip__name">{bank.name}</span>
                      </button>
                    ))}
                  </div>
                  <p className="payos-note">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    Hỗ trợ thanh toán QR / chuyển khoản qua hơn 10 ngân hàng
                  </p>
                </div>
              )}

              {/* ── Visa / Mastercard: Real card preview ── */}
              {(selectedMethod === 'visa' || selectedMethod === 'mastercard') && (
                <div className="card-preview-section">
                  {/* Template picker */}
                  <div className="card-template-picker">
                    {(selectedMethod === 'visa' ? VISA_TEMPLATES : MC_TEMPLATES).map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        className={`card-tpl-swatch${cardTemplate === tpl.id ? ' active' : ''}`}
                        style={{ background: tpl.swatch }}
                        title={tpl.label}
                        onClick={() => {
                          setCardTemplate(tpl.id);
                          setCardFlipped(false);
                        }}
                      />
                    ))}
                    <span className="card-tpl-hint">Chọn mẫu</span>
                  </div>

                  {/* Flip container */}
                  <div
                    className="card-flip-container"
                    onClick={() => setCardFlipped((f) => !f)}
                    title={cardFlipped ? 'Xem mặt trước' : 'Xem mặt sau'}
                  >
                    <div className={`card-flipper${cardFlipped ? ' flipped' : ''}`}>
                      {/* ── FRONT FACE ── */}
                      <div
                        className="card-face card-face--front"
                        style={{ background: _cardTpl.gradient }}
                      >
                        {_cardTpl.patternEl}
                        <div className="cp-deco-circle cp-deco-circle--1" aria-hidden="true" />
                        <div className="cp-deco-circle cp-deco-circle--2" aria-hidden="true" />

                        <div className="cp-top-row">
                          <div className="cp-chip" aria-hidden="true">
                            <div className="cp-chip-h" />
                            <div className="cp-chip-v" />
                          </div>
                          <svg
                            className="cp-contactless"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          >
                            <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                            <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                            <circle cx="12" cy="20" r="1" fill="currentColor" />
                          </svg>
                        </div>

                        <div className="cp-number">
                          {cardNumber
                            ? cardNumber.padEnd(19, ' ').replace(/X/g, '•')
                            : '•••• •••• •••• ••••'}
                        </div>

                        <div className="cp-bottom-row">
                          <div className="cp-field">
                            <span className="cp-field-label">Card Holder</span>
                            <span className="cp-field-value">{cardName || 'YOUR NAME'}</span>
                          </div>
                          <div className="cp-field">
                            <span className="cp-field-label">Expires</span>
                            <span className="cp-field-value cp-field-value--mono">
                              {cardExpiry || 'MM/YY'}
                            </span>
                          </div>
                          <div className="cp-logo-wrap">
                            {selectedMethod === 'visa' ? <VisaLogo /> : <MastercardLogo />}
                          </div>
                        </div>

                        {/* Coming-soon overlay */}
                        <div className="cp-overlay">
                          <span className="cs-badge">Sắp ra mắt</span>
                          <p>Nhấn để xem mặt sau</p>
                        </div>
                      </div>

                      {/* ── BACK FACE ── */}
                      <div
                        className="card-face card-face--back"
                        style={{ background: _cardTpl.gradient }}
                      >
                        {_cardTpl.patternEl}
                        <div className="cp-deco-circle cp-deco-circle--1" aria-hidden="true" />
                        {/* Magnetic stripe */}
                        <div className="cp-mag-stripe" aria-hidden="true" />
                        {/* Signature + CVV strip */}
                        <div className="cp-sig-row">
                          <div className="cp-sig-strip">
                            <span className="cp-sig-lines" aria-hidden="true" />
                            <span className="cp-sig-text">Authorized Signature</span>
                          </div>
                          <div className="cp-cvv-box">
                            <span className="cp-cvv-label">CVV</span>
                            <span className="cp-cvv-val">{cardCvv || '•••'}</span>
                          </div>
                        </div>
                        {/* Bottom: network + hint */}
                        <div className="cp-back-footer">
                          <span className="cp-back-hint">Nhấn để xem mặt trước</span>
                          <div className="cp-logo-wrap">
                            {selectedMethod === 'visa' ? <VisaLogo /> : <MastercardLogo />}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Input fields below card (blurred / disabled) */}
                  <div className="card-inputs-blur" aria-disabled="true">
                    <div className="card-form__field">
                      <label>Số thẻ</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        disabled
                      />
                    </div>
                    <div className="card-form__field">
                      <label>Tên chủ thẻ</label>
                      <input
                        type="text"
                        placeholder="NGUYEN VAN A"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value.toUpperCase())}
                        disabled
                      />
                    </div>
                    <div className="card-form__row">
                      <div className="card-form__field">
                        <label>Ngày hết hạn</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="MM/YY"
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                          disabled
                        />
                      </div>
                      <div className="card-form__field">
                        <label>CVV</label>
                        <input
                          type="password"
                          inputMode="numeric"
                          placeholder="•••"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) =>
                            setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))
                          }
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Amount Input */}
              <div className="amount-field">
                <label htmlFor="deposit-amount">Số tiền nạp</label>
                <div className="amount-input-wrap">
                  <input
                    id="deposit-amount"
                    type="text"
                    className="amount-input"
                    value={formatCurrency(amount)}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      setAmount(raw ? Number(raw) : 0);
                    }}
                    placeholder="100.000"
                  />
                  <span className="amount-suffix">VND</span>
                </div>
              </div>

              {/* Quick-amount pills */}
              <div className="quick-amounts">
                {QUICK_AMOUNTS.map((preset) => (
                  <button
                    key={preset}
                    className={`quick-pill${amount === preset ? ' active' : ''}`}
                    onClick={() => setAmount(preset)}
                  >
                    +{preset >= 1_000_000 ? `${preset / 1_000_000}M` : `${preset / 1000}k`}
                  </button>
                ))}
              </div>

              {/* CTA */}
              {depositing ? (
                <div className="btn-deposit-processing">
                  <span className="btn-deposit-processing__text">Đang xử lý...</span>
                  <span className="btn-deposit-processing__bar" aria-hidden="true" />
                </div>
              ) : (
                <button
                  className={`btn-deposit${depositSuccess ? ' success' : ''}${selectedMethod !== 'payos' ? ' disabled-method' : ''}`}
                  onClick={selectedMethod === 'payos' ? handleDepositClick : undefined}
                  disabled={selectedMethod !== 'payos'}
                >
                  <span className="btn-shimmer" aria-hidden="true" />
                  {depositSuccess ? (
                    <>&#10003;&nbsp;Đã tạo liên kết!</>
                  ) : selectedMethod !== 'payos' ? (
                    <>Phương thức đang phát triển</>
                  ) : (
                    <>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                      Xem hóa đơn &amp; Thanh toán
                    </>
                  )}
                </button>
              )}

              {/* Trust Signal */}
              <div className="trust-badge">
                <Lock size={12} />
                <span>Thanh toán bảo mật bởi PayOS · Chuẩn mã hoá PCI DSS</span>
              </div>
            </article>
          </section>

          {/* Transaction Ledger */}
          <section className="transactions-panel">
            <div className="transactions-head">
              <div>
                <h2>Lịch sử giao dịch</h2>
                <p>
                  Tổng nạp thành công: <strong>{formatCurrency(totalDeposit)} VND</strong>
                </p>
              </div>

              <div className="transactions-controls">
                <div className="search-box">
                  <Search size={15} />
                  <input
                    type="text"
                    placeholder="Tìm theo mã giao dịch..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as TransactionStatusFilter)}
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="completed">Thành công</option>
                  <option value="pending">Đang chờ</option>
                  <option value="failed">Thanh toán lỗi</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>
            </div>

            {/* List Body */}
            <div className="transaction-list">
              {transactionsLoading &&
                Array.from({ length: 4 }).map((_, i) => <div key={i} className="tx-skeleton" />)}

              {!transactionsLoading && paginatedTransactions.length === 0 && (
                <div className="empty-state">
                  <TrendingUp size={52} className="empty-icon" />
                  <h3>Chưa có giao dịch nào</h3>
                  <p>Nạp tiền lần đầu để bắt đầu hành trình học tập của bạn</p>
                  <button
                    className="btn-empty-cta"
                    onClick={() =>
                      document.querySelector<HTMLInputElement>('#deposit-amount')?.focus()
                    }
                  >
                    Nạp tiền lần đầu
                  </button>
                </div>
              )}

              {!transactionsLoading &&
                paginatedTransactions.map((tx) => {
                  const status = normalizeStatus(tx.status);
                  const type = normalizeType(tx);
                  const { day, time } = formatDate(tx.transactionDate ?? tx.createdAt);

                  return (
                    <div key={String(tx.transactionId ?? tx.orderCode)} className="tx-row">
                      <div className={`tx-icon-wrap ${type}`}>
                        {type === 'deposit' ? (
                          <ArrowUpRight size={18} />
                        ) : (
                          <ArrowDownLeft size={18} />
                        )}
                      </div>

                      <div className="tx-info">
                        <div className="tx-title">
                          {type === 'deposit'
                            ? 'Nạp tiền vào ví'
                            : tx.description || 'Thanh toán khoá học'}
                        </div>
                        <div className="tx-meta">
                          <span className="tx-code">#{getTransactionCode(tx)}</span>
                          <span className="tx-sep">·</span>
                          <span className="tx-time">
                            {day} {time}
                          </span>
                        </div>
                      </div>

                      <div className="tx-right">
                        <div
                          className={`tx-amount ${type === 'deposit' ? 'positive' : 'negative'}`}
                        >
                          {type === 'deposit' ? '+' : '−'}
                          {formatCurrency(Math.abs(tx.amount))}đ
                        </div>
                        <span className={`tx-status-badge ${status}`}>
                          {status === 'completed'
                            ? 'Thành công'
                            : status === 'pending'
                              ? 'Đang chờ'
                              : status === 'cancelled'
                                ? 'Đã hủy'
                                : 'Thanh toán lỗi'}
                        </span>
                        {status === 'pending' && tx.expiresAt && (
                          <TxCountdown expiresAt={tx.expiresAt} />
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            <footer className="transactions-footer">
              <span>
                Hiển thị {displayStart}–{displayEnd} / {filteredTransactions.length} giao dịch
              </span>

              <div className="pagination">
                <button
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={safePage === 1}
                >
                  <ChevronLeft size={15} />
                </button>

                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((n) => (
                  <button
                    key={n}
                    className={n === safePage ? 'active' : ''}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                ))}

                <button
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={safePage === totalPages}
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </footer>
          </section>
        </div>
      </DashboardLayout>

      {/* ── Balance Card Template Picker Modal ── */}
      {showTplModal && (
        <div
          className="sw-modal-overlay bc-tpl-modal-overlay"
          onClick={() => setShowTplModal(false)}
        >
          <div className="bc-tpl-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bc-tpl-modal-header">
              <span className="bc-tpl-modal-title">Chọn mẫu thẻ</span>
              <button
                type="button"
                className="sw-modal-close"
                onClick={() => setShowTplModal(false)}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>
            <div className="bc-tpl-modal-grid">
              {BALANCE_CARD_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  className={`bc-tpl-card-btn${balanceCardTemplate === tpl.id ? ' active' : ''}`}
                  onClick={() => {
                    setBalanceCardTemplate(tpl.id);
                    setBalanceCardFlipped(false);
                    setShowTplModal(false);
                  }}
                >
                  <div className="bc-tpl-card-preview" style={{ background: tpl.gradient }}>
                    {tpl.patternEl}
                    <span className="bc-tpl-card-name">{tpl.label}</span>
                  </div>
                  {balanceCardTemplate === tpl.id && <span className="bc-tpl-card-check">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Pending Transaction Warning ── */}
      {showPendingWarning && (
        <div className="sw-modal-overlay" onClick={() => setShowPendingWarning(false)}>
          <div className="sw-confirm-modal sw-pending-warning" onClick={(e) => e.stopPropagation()}>
            <button
              className="sw-modal-close"
              onClick={() => setShowPendingWarning(false)}
              aria-label="Đóng"
            >
              <X size={16} />
            </button>

            <div className="sw-pw-icon" aria-hidden="true">
              ⚠️
            </div>
            <h3 className="sw-pw-title">Có giao dịch đang chờ thanh toán</h3>
            <p className="sw-pw-body">
              Bạn đang có <strong>1 giao dịch PayOS chưa hoàn thành</strong>. Giao dịch cũ sẽ tự
              động bị hủy sau 15 phút nếu chưa thanh toán.
            </p>
            <p className="sw-pw-body">Bạn có chắc muốn tạo thêm một giao dịch mới không?</p>

            <div className="sw-modal-actions">
              <button
                className="sw-modal-btn sw-modal-btn--cancel"
                onClick={() => setShowPendingWarning(false)}
              >
                Quay lại
              </button>
              <button
                className="sw-modal-btn sw-modal-btn--confirm"
                onClick={() => {
                  setShowPendingWarning(false);
                  setShowConfirmModal(true);
                }}
              >
                Tạo giao dịch mới
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation Bill Modal ── */}
      {showConfirmModal && (
        <div className="sw-modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="sw-confirm-modal" onClick={(e) => e.stopPropagation()}>
            {/* Close */}
            <button
              className="sw-modal-close"
              onClick={() => setShowConfirmModal(false)}
              aria-label="Đóng"
            >
              <X size={16} />
            </button>

            {/* Gradient header with amount */}
            <div className="sw-modal-hero">
              <div className="sw-modal-hero__label">Tổng thanh toán</div>
              <div className="sw-modal-hero__amount">
                {formatCurrency(amount)}
                <span className="sw-modal-hero__currency">₫</span>
              </div>
              <div className="sw-modal-hero__sub">Nạp tiền vào ví MathMaster</div>
            </div>

            {/* Bill card */}
            <div className="sw-bill-card">
              {/* Method row */}
              <div className="sw-bill-row2">
                <span className="sw-bill-row2__label">Phương thức</span>
                <span className="sw-bill-row2__val">
                  <span className="sw-payos-badge">
                    <svg width="10" height="10" viewBox="0 0 10 10">
                      <circle cx="5" cy="5" r="5" fill="#fff" opacity="0.3" />
                    </svg>
                    PayOS
                  </span>
                  <span className="sw-bill-row2__method-txt">QR / Chuyển khoản</span>
                </span>
              </div>

              {/* Bank row (only if selected) */}
              {selectedBank &&
                (() => {
                  const bank = VN_BANKS.find((b) => b.id === selectedBank);
                  return bank ? (
                    <div className="sw-bill-row2">
                      <span className="sw-bill-row2__label">Ngân hàng</span>
                      <span className="sw-bill-row2__val sw-bill-row2__val--bank">
                        <span
                          className="sw-bill-bank-icon"
                          style={{ borderColor: `${bank.color}30` }}
                        >
                          <BankLogoSVG id={bank.id} color={bank.color} />
                        </span>
                        {bank.name}
                      </span>
                    </div>
                  ) : null;
                })()}

              {/* Fee row */}
              <div className="sw-bill-row2">
                <span className="sw-bill-row2__label">Phí giao dịch</span>
                <span className="sw-bill-row2__val">
                  <span className="sw-free-badge">Miễn phí</span>
                </span>
              </div>

              <div className="sw-bill-sep" />

              {/* Total */}
              <div className="sw-bill-total-row">
                <span>Số tiền nhận được</span>
                <span className="sw-bill-total-val">{formatCurrency(amount)} ₫</span>
              </div>
            </div>

            {/* Security note */}
            <div className="sw-security-note">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Thanh toán bảo mật · Mã hoá PCI DSS
            </div>

            {/* Actions */}
            <div className="sw-modal-actions">
              <button
                className="sw-modal-btn sw-modal-btn--cancel"
                onClick={() => setShowConfirmModal(false)}
              >
                Huỷ bỏ
              </button>
              <button
                className="sw-modal-btn sw-modal-btn--confirm"
                onClick={handleConfirmDeposit}
                disabled={depositing}
              >
                {depositing ? (
                  <>
                    <span className="spinner" style={{ width: 15, height: 15, borderWidth: 2 }} />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Xác nhận thanh toán
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentWallet;
