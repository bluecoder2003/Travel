import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "404 — You've wandered off the itinerary | Cleartrip",
  description: "The page you're looking for has gone on holiday.",
};

export default function NotFound() {
  return (
    <main
      className="relative min-h-screen w-full overflow-hidden bg-[#F8F0F0]"
      style={{
        backgroundImage: "url(/luggage.svg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Soft warm vignette anchoring the bottom-left text against the illustration */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 55% at 16% 92%, rgba(255,79,23,0.16) 0%, rgba(255,79,23,0) 55%), linear-gradient(180deg, rgba(247,201,188,0) 50%, rgba(247,201,188,0.5) 100%)",
        }}
      />

      {/* Subtle grain for editorial texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.7 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      {/* Top-left: Cleartrip logo */}
      <header className="absolute right-2 top-2 md:right-6 md:top-6 ">
        <Link href="/" aria-label="Cleartrip home" className="inline-block">
          <Image
            src="/logo.png"
            alt="Cleartrip"
            width={200}
            height={64}
            priority
            className="h-14 w-auto"
          />
        </Link>
      </header>

      {/* Top-right: status pill */}
      {/* <div className="absolute right-6 top-6 hidden items-center gap-2 sm:right-10 sm:top-8 sm:flex">
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 rounded-full bg-ct-orange"
          style={{ boxShadow: "0 0 0 3px rgba(255,79,23,0.18)" }}
        />
        <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-ct-text">
          Status&nbsp;·&nbsp;Page missing
        </span>
      </div> */}

      {/* Decorative dashed flight path */}
      

      {/* Bottom-left content block */}
      <section className="absolute bottom-0 left-0 w-full px-6 pb-10 sm:px-10 sm:pb-14 md:max-w-[640px]">
        {/* <div className="flex items-center gap-3">
          <span aria-hidden className="inline-block h-px w-10 bg-ct-text/60" />
          <span className="text-[11px] font-medium uppercase tracking-[0.3em] text-ct-text">
            Error&nbsp;·&nbsp;Lost luggage
          </span>
        </div> */}

        <h1
          className="mt-3 flex items-baseline gap-1 font-bold leading-[0.85] tracking-[-0.04em] text-ct-text"
          style={{ fontSize: "clamp(40px, 17vw, 100px)" }}
        >
          <span>4</span>
          <span className="text-ct-orange italic">0</span>
          <span className="pl-3">4</span>
        </h1>

        <p className="mt-2 text-ct-xl font-semibold tracking-tight text-ct-text sm:text-ct-3xl">
          Page not found.
        </p>

        <p className="mt-3 max-w-md text-ct-sm md:text-ct-md leading-relaxed text-ct-text-secondary">
          Looks like this page took an unscheduled layover. The bags are here,
          the traveller&apos;s napping, but the URL you&apos;re after never
          made it past baggage claim.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-ct-full bg-ct-orange px-5 py-3 text-ct-sm font-semibold text-white transition-all duration-[var(--duration-ct)] hover:bg-ct-orange-hover hover:shadow-[var(--shadow-ct-md)]"
          >
            Take me home
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden
              className="transition-transform duration-[var(--duration-ct)] group-hover:translate-x-0.5"
            >
              <path
                d="M2 7h10M8 3l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>

          {/* <Link
            href="/flights"
            className="inline-flex items-center gap-2 rounded-ct-full border border-ct-text/30 bg-white/40 px-5 py-3 text-ct-sm font-semibold text-ct-text backdrop-blur-sm transition-colors duration-[var(--duration-ct)] hover:border-ct-text hover:bg-ct-text hover:text-white"
          >
            Search flights
          </Link> */}
        </div>
      </section>

      {/* Bottom-right: boarding-pass corner */}
      {/* <div className="absolute bottom-10 right-6 hidden items-end gap-4 sm:right-10 sm:flex">
        <div className="text-right">
          <div className="text-[10px] font-medium uppercase tracking-[0.28em] text-ct-text-muted">
            Gate
          </div>
          <div className="mt-1 text-ct-2xl font-semibold leading-none text-ct-text">
            —
          </div>
        </div> */}
        {/* <div
          aria-hidden
          className="h-10 w-px"
          style={{
            backgroundImage: "linear-gradient(#151515 50%, transparent 0)",
            backgroundSize: "1px 6px",
            backgroundRepeat: "repeat-y",
            opacity: 0.3,
          }}
        />
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.28em] text-ct-text-muted">
            Destination
          </div>
          <div className="mt-1 text-ct-2xl font-semibold leading-none text-ct-text">
            Unknown
          </div>
        </div> */}
      {/* </div> */}
    </main>
  );
}
