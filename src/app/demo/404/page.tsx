import type { Metadata } from "next";

/**
 * STANDALONE UI DEMO — the "404 becomes a face" idea (CoolIdeas). Pure SVG +
 * CSS (no JS/GSAP): the 4s slide up, the 0 slides down into a nose, eyes blink
 * and glance side-to-side, then a mouth draws in. Candidate for the real 404.
 */
export const metadata: Metadata = {
  title: "404 face — demo",
  robots: { index: false, follow: false },
};

export default function Demo404Page() {
  return (
    <main className="grid min-h-screen place-items-center bg-neutral-50 text-neutral-900">
      <style>{`
        .face { display:block; width:14em; height:auto; }
        .face__eyes,.face__eye-lid,.face__mouth-left,.face__mouth-right,.face__nose,.face__pupil{
          animation: faceIn 1s 0.3s cubic-bezier(0.65,0,0.35,1) forwards;
        }
        .face__eye-lid,.face__pupil{ animation-duration:4s; animation-delay:1.3s; animation-iteration-count:infinite; }
        .face__eye-lid{ animation-name: eyeLid; }
        .face__mouth-left,.face__mouth-right{ animation-timing-function: cubic-bezier(0.33,1,0.68,1); }
        .face__mouth-left{ animation-name: mouthLeft; }
        .face__mouth-right{ animation-name: mouthRight; }
        .face__nose{ animation-name: nose; }
        .face__pupil{ animation-name: pupil; }
        @keyframes faceIn{ from{transform:translateY(112.5px)} to{transform:translateY(15px)} }
        @keyframes eyeLid{ from,40%,45%,to{transform:translateY(0)} 42.5%{transform:translateY(17.5px)} }
        @keyframes pupil{
          from,37.5%,40%,45%,87.5%,to{ stroke-dashoffset:0; transform:translate(0,0); }
          12.5%,25%,62.5%,75%{ stroke-dashoffset:0; transform:translate(-35px,0); }
          42.5%{ stroke-dashoffset:35; transform:translate(0,17.5px); }
        }
        @keyframes mouthLeft{ from,50%{stroke-dashoffset:-102} to{stroke-dashoffset:0} }
        @keyframes mouthRight{ from,50%{stroke-dashoffset:102} to{stroke-dashoffset:0} }
        @keyframes nose{ from{transform:translate(0,0)} to{transform:translate(0,22.5px)} }
        @media (prefers-reduced-motion: reduce){
          .face__eyes,.face__eye-lid,.face__mouth-left,.face__mouth-right,.face__nose,.face__pupil{ animation: none; }
        }
      `}</style>

      <div className="flex flex-col items-center gap-6 text-center">
        <svg
          className="face"
          viewBox="0 0 320 380"
          width="320"
          height="380"
          aria-label="A 404 that becomes a face: the 4s slide up, the 0 slides down, eyes blink and a mouth appears."
        >
          <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={25}>
            <g className="face__eyes" transform="translate(0, 112.5)">
              <g transform="translate(15, 0)">
                <polyline className="face__eye-lid" points="37,0 0,120 75,120" />
                <polyline className="face__pupil" points="55,120 55,155" strokeDasharray="35 35" />
              </g>
              <g transform="translate(230, 0)">
                <polyline className="face__eye-lid" points="37,0 0,120 75,120" />
                <polyline className="face__pupil" points="55,120 55,155" strokeDasharray="35 35" />
              </g>
            </g>
            <rect className="face__nose" rx={4} ry={4} x={132.5} y={112.5} width={55} height={155} />
            <g strokeDasharray="102 102" transform="translate(65, 334)">
              <path className="face__mouth-left" d="M 0 30 C 0 30 40 0 95 0" strokeDashoffset={-102} />
              <path className="face__mouth-right" d="M 95 0 C 150 0 190 30 190 30" strokeDashoffset={102} />
            </g>
          </g>
        </svg>
        <p className="text-lg text-neutral-600">Looks like this page wandered off.</p>
      </div>
    </main>
  );
}
