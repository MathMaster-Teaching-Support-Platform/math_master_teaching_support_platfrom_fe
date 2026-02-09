// Decorative SVG Components for Homepage
import React from 'react';

export const SphereSVG: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle
      cx="100"
      cy="100"
      r="90"
      fill="#6366f1"
      fillOpacity="0.1"
      stroke="#6366f1"
      strokeWidth="2"
    />
    <ellipse
      cx="100"
      cy="100"
      rx="90"
      ry="40"
      fill="none"
      stroke="#6366f1"
      strokeWidth="2"
      strokeDasharray="4 4"
    />
    <ellipse
      cx="100"
      cy="100"
      rx="40"
      ry="90"
      fill="none"
      stroke="#6366f1"
      strokeWidth="2"
      strokeDasharray="4 4"
    />
    <circle cx="100" cy="100" r="85" fill="none" stroke="#6366f1" strokeWidth="1" opacity="0.3" />
  </svg>
);

export const TriangleSVG: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M100 20 L180 180 L20 180 Z"
      fill="#ec4899"
      fillOpacity="0.1"
      stroke="#ec4899"
      strokeWidth="3"
    />
    <circle cx="100" cy="20" r="6" fill="#ec4899" />
    <circle cx="180" cy="180" r="6" fill="#ec4899" />
    <circle cx="20" cy="180" r="6" fill="#ec4899" />
    <line x1="100" y1="80" x2="140" y2="140" stroke="#ec4899" strokeWidth="2" />
    <line x1="100" y1="80" x2="60" y2="140" stroke="#ec4899" strokeWidth="2" />
  </svg>
);

export const FormulaSVG: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <text
      x="10"
      y="40"
      fontFamily="serif"
      fontSize="32"
      fontStyle="italic"
      fill="#8b5cf6"
      opacity="0.6"
    >
      x² + y²
    </text>
    <text
      x="20"
      y="80"
      fontFamily="serif"
      fontSize="28"
      fontStyle="italic"
      fill="#8b5cf6"
      opacity="0.6"
    >
      = r²
    </text>
    <path d="M 15 50 Q 90 45 165 50" stroke="#8b5cf6" strokeWidth="2" opacity="0.4" fill="none" />
  </svg>
);

export const DiagramSVG: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Central box */}
    <rect
      x="150"
      y="50"
      width="100"
      height="60"
      rx="8"
      fill="white"
      stroke="#6366f1"
      strokeWidth="2"
    />

    {/* Two bottom boxes */}
    <rect
      x="80"
      y="180"
      width="100"
      height="60"
      rx="8"
      fill="white"
      stroke="#ec4899"
      strokeWidth="2"
    />
    <rect
      x="220"
      y="180"
      width="100"
      height="60"
      rx="8"
      fill="white"
      stroke="#f97316"
      strokeWidth="2"
    />

    {/* Circles on sides */}
    <circle cx="30" cy="80" r="20" fill="white" stroke="#6366f1" strokeWidth="2" />
    <circle cx="370" cy="80" r="20" fill="white" stroke="#6366f1" strokeWidth="2" />

    {/* Connecting lines */}
    <line x1="200" y1="110" x2="130" y2="180" stroke="#8b5cf6" strokeWidth="2" />
    <line x1="200" y1="110" x2="270" y2="180" stroke="#8b5cf6" strokeWidth="2" />
    <line x1="50" y1="80" x2="150" y2="80" stroke="#6366f1" strokeWidth="2" />
    <line x1="250" y1="80" x2="350" y2="80" stroke="#6366f1" strokeWidth="2" />
  </svg>
);

export const QuestionBubbleSVG: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Cloud shape */}
    <path
      d="M50 100 Q50 60 90 60 Q110 40 130 60 Q170 60 170 100 Q170 140 130 140 Q110 160 90 140 Q50 140 50 100Z"
      fill="white"
      stroke="#6366f1"
      strokeWidth="3"
    />

    {/* Question mark */}
    <text x="85" y="120" fontFamily="Arial" fontSize="48" fontWeight="bold" fill="#6366f1">
      ?
    </text>

    {/* Small circles at bottom */}
    <circle cx="60" cy="160" r="8" fill="#6366f1" opacity="0.6" />
    <circle cx="45" cy="175" r="6" fill="#6366f1" opacity="0.4" />
    <circle cx="30" cy="185" r="4" fill="#6366f1" opacity="0.2" />
  </svg>
);

export const CheckBubbleSVG: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Rectangle speech bubble */}
    <rect
      x="40"
      y="30"
      width="120"
      height="80"
      rx="12"
      fill="white"
      stroke="#f97316"
      strokeWidth="3"
    />
    <path d="M 80 110 L 70 130 L 100 110 Z" fill="white" stroke="#f97316" strokeWidth="3" />

    {/* Checkmark circle */}
    <circle
      cx="100"
      cy="70"
      r="25"
      fill="#ec4899"
      fillOpacity="0.2"
      stroke="#ec4899"
      strokeWidth="2"
    />

    {/* Checkmark */}
    <path
      d="M 85 70 L 95 80 L 115 60"
      stroke="#ec4899"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
