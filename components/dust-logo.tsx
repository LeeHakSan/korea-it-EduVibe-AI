import React from "react"

// 먼지 로고 (svg)
export default function DustLogo({ size = 68 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 680 520"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
    >
      <style>{`
        @keyframes dbob {0%,100%{transform:translateY(0px) rotate(0deg)}25%{transform:translateY(-10px) rotate(-2deg)}75%{transform:translateY(-5px) rotate(2deg)}}
        @keyframes dblink {0%,88%,100%{transform:scaleY(1)}93%{transform:scaleY(0.08)}}
        @keyframes dwobble {0%,100%{transform:scale(1,1)}40%{transform:scale(1.05,0.96)}70%{transform:scale(0.96,1.05)}}
        @keyframes dsparkle {0%,100%{opacity:0;transform:scale(0.2)}50%{opacity:1;transform:scale(1)}}
        @keyframes ddrift {0%,100%{transform:translate(0,0)}50%{transform:translate(2px,-5px)}}
        @keyframes dlegNW {0%,100%{transform:rotate(-14deg)}50%{transform:rotate(14deg)}}
        @keyframes dlegNE {0%,100%{transform:rotate(14deg)}50%{transform:rotate(-14deg)}}
        @keyframes dlegSW {0%,100%{transform:rotate(10deg)}50%{transform:rotate(-10deg)}}
        @keyframes dlegSE {0%,100%{transform:rotate(-10deg)}50%{transform:rotate(10deg)}}
        .dbody2{animation:dbob 2.6s ease-in-out infinite,dwobble 2.6s ease-in-out infinite;transform-origin:340px 255px}
        .deyeL2{animation:dblink 4s ease-in-out infinite;transform-origin:316px 244px}
        .deyeR2{animation:dblink 4s ease-in-out infinite 0.1s;transform-origin:360px 242px}
        .dlegNW2{animation:dlegNW 0.6s ease-in-out infinite;transform-origin:272px 210px}
        .dlegNE2{animation:dlegNE 0.6s ease-in-out infinite 0.1s;transform-origin:408px 210px}
        .dlegSW2{animation:dlegSW 0.6s ease-in-out infinite 0.05s;transform-origin:272px 300px}
        .dlegSE2{animation:dlegSE 0.6s ease-in-out infinite 0.15s;transform-origin:408px 300px}
        .ds12{animation:dsparkle 2s ease-in-out infinite 0s;transform-origin:210px 195px}
        .ds22{animation:dsparkle 2s ease-in-out infinite 0.5s;transform-origin:472px 195px}
        .ds32{animation:dsparkle 2s ease-in-out infinite 1s;transform-origin:340px 148px}
        .dp12{animation:ddrift 3s ease-in-out infinite}
        .dp22{animation:ddrift 2.8s ease-in-out infinite 0.7s}
        .dp32{animation:ddrift 3.4s ease-in-out infinite 1.2s}
      `}</style>

      <g className="dp12">
        <circle cx="225" cy="220" r="4" fill="rgba(255,255,255,0.3)" />
      </g>
      <g className="dp22">
        <circle cx="460" cy="215" r="3" fill="rgba(255,255,255,0.25)" />
      </g>
      <g className="dp32">
        <circle cx="340" cy="165" r="3" fill="rgba(255,255,255,0.25)" />
      </g>

      <g className="ds12">
        <path
          d="M210 188 L212 195 L210 202 L208 195Z"
          fill="rgba(255,255,255,0.6)"
        />
        <path
          d="M203 195 L210 197 L217 195 L210 193Z"
          fill="rgba(255,255,255,0.6)"
        />
      </g>
      <g className="ds22">
        <path
          d="M472 188 L474 195 L472 202 L470 195Z"
          fill="rgba(255,255,255,0.6)"
        />
        <path
          d="M465 195 L472 197 L479 195 L472 193Z"
          fill="rgba(255,255,255,0.6)"
        />
      </g>
      <g className="ds32">
        <path
          d="M340 141 L342 148 L340 155 L338 148Z"
          fill="rgba(255,255,255,0.6)"
        />
        <path
          d="M333 148 L340 150 L347 148 L340 146Z"
          fill="rgba(255,255,255,0.6)"
        />
      </g>

      <g className="dbody2">
        <g className="dlegNW2">
          <path
            d="M272 210 L230 178 L230 145"
            fill="none"
            stroke="white"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <g className="dlegNE2">
          <path
            d="M408 210 L450 178 L450 145"
            fill="none"
            stroke="white"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <g className="dlegSW2">
          <path
            d="M272 300 L230 332 L230 368"
            fill="none"
            stroke="white"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <g className="dlegSE2">
          <path
            d="M408 300 L450 332 L450 368"
            fill="none"
            stroke="white"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        <ellipse cx="308" cy="190" rx="12" ry="14" fill="white" />
        <ellipse cx="326" cy="179" rx="8" ry="11" fill="white" />
        <ellipse cx="342" cy="176" rx="11" ry="13" fill="white" />
        <ellipse cx="360" cy="181" rx="9" ry="10" fill="white" />
        <ellipse cx="376" cy="190" rx="13" ry="11" fill="white" />
        <ellipse cx="391" cy="204" rx="10" ry="9" fill="white" />
        <ellipse cx="402" cy="220" rx="9" ry="11" fill="white" />
        <ellipse cx="408" cy="238" rx="7" ry="9" fill="white" />
        <ellipse cx="410" cy="257" rx="9" ry="10" fill="white" />
        <ellipse cx="407" cy="276" rx="8" ry="9" fill="white" />
        <ellipse cx="400" cy="292" rx="11" ry="9" fill="white" />
        <ellipse cx="388" cy="305" rx="10" ry="8" fill="white" />
        <ellipse cx="372" cy="315" rx="9" ry="8" fill="white" />
        <ellipse cx="354" cy="321" rx="8" ry="7" fill="white" />
        <ellipse cx="338" cy="325" rx="11" ry="8" fill="white" />
        <ellipse cx="320" cy="322" rx="8" ry="7" fill="white" />
        <circle cx="304" cy="314" r="8" fill="white" />
        <ellipse cx="290" cy="303" rx="11" ry="9" fill="white" />
        <ellipse cx="277" cy="288" rx="10" ry="9" fill="white" />
        <ellipse cx="270" cy="270" rx="8" ry="10" fill="white" />
        <ellipse cx="269" cy="250" rx="9" ry="9" fill="white" />
        <ellipse cx="272" cy="231" rx="8" ry="10" fill="white" />
        <ellipse cx="280" cy="214" rx="10" ry="9" fill="white" />
        <ellipse cx="292" cy="200" rx="12" ry="10" fill="white" />

        <ellipse cx="318" cy="173" rx="5" ry="7" fill="rgba(255,255,255,0.7)" />
        <ellipse cx="363" cy="175" rx="4" ry="6" fill="rgba(255,255,255,0.65)" />
        <ellipse cx="350" cy="328" rx="5" ry="4" fill="rgba(255,255,255,0.55)" />

        <g className="deyeL2">
          <ellipse cx="316" cy="244" rx="10" ry="12" fill="white" />
        </g>
        <g className="deyeR2">
          <ellipse cx="362" cy="242" rx="9" ry="11" fill="white" />
        </g>
      </g>
    </svg>
  )
}

