"use client";

type AmbientBackdropProps = {
  variant?: "hero" | "pricing" | "dashboard" | "bank";
};

const variants: Record<
  NonNullable<AmbientBackdropProps["variant"]>,
  {
    orbOne: string;
    orbTwo: string;
    orbThree: string;
    beamClass: string;
  }
> = {
  hero: {
    orbOne:
      "-right-16 -top-12 h-52 w-52 motion-orb motion-orb-gold float-card",
    orbTwo:
      "left-[6%] top-[42%] h-44 w-44 motion-orb motion-orb-ice float-card-alt",
    orbThree:
      "right-[26%] bottom-[-3rem] h-56 w-56 motion-orb motion-orb-mint float-card",
    beamClass: "motion-beam",
  },
  pricing: {
    orbOne:
      "right-[10%] top-[8%] h-48 w-48 motion-orb motion-orb-gold float-card",
    orbTwo:
      "-left-10 bottom-[12%] h-44 w-44 motion-orb motion-orb-ice float-card-alt",
    orbThree:
      "right-[32%] bottom-[-4rem] h-52 w-52 motion-orb motion-orb-mint float-card",
    beamClass: "motion-beam opacity-60",
  },
  dashboard: {
    orbOne:
      "right-[8%] top-[-3rem] h-40 w-40 motion-orb motion-orb-gold float-card",
    orbTwo:
      "left-[4%] bottom-[-2rem] h-36 w-36 motion-orb motion-orb-ice float-card-alt",
    orbThree:
      "right-[30%] top-[35%] h-40 w-40 motion-orb motion-orb-mint float-card",
    beamClass: "motion-beam opacity-50",
  },
  bank: {
    orbOne:
      "right-[12%] top-[5%] h-44 w-44 motion-orb motion-orb-gold float-card",
    orbTwo:
      "-left-8 top-[25%] h-36 w-36 motion-orb motion-orb-ice float-card-alt",
    orbThree:
      "right-[38%] bottom-[-2rem] h-44 w-44 motion-orb motion-orb-mint float-card",
    beamClass: "motion-beam opacity-55",
  },
};

export function AmbientBackdrop({
  variant = "hero",
}: AmbientBackdropProps) {
  const config = variants[variant];

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="motion-grid" />
      <div className={config.orbOne} />
      <div className={config.orbTwo} />
      <div className={config.orbThree} />
      <div className={config.beamClass} />
    </div>
  );
}
