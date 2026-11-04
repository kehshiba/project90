"use client";

import { Check, LockKeyhole, Sparkles, Trophy } from "lucide-react";
import {
  ChallengeData,
  getAchievements,
} from "@/lib/challenge";
import {
  achievementIcons,
  achievementTints,
  SectionHeading,
} from "./shared";

export function AchievementsSection({
  data,
  today,
  embedded = false,
}: {
  data: ChallengeData;
  today: string;
  embedded?: boolean;
}) {
  const achievements = getAchievements(data, today);
  const unlocked = achievements.filter((achievement) => achievement.unlocked).length;
  const completion = Math.round((unlocked / achievements.length) * 100);

  const grid = (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
        {achievements.map((achievement) => {
          const tint = achievementTints[achievement.tint] ?? achievementTints.sage;
          const Icon = achievementIcons[achievement.icon] ?? Trophy;
          const progress = Math.min(
            100,
            Math.round((achievement.value / achievement.target) * 100),
          );

          return (
            <article
              key={achievement.id}
              className={`achievement-card relative overflow-hidden rounded-[21px] border p-4 ${
                achievement.unlocked
                  ? `${tint.bg} ${tint.border}`
                  : "border-[#e9e2d6] bg-[#fbf8f1]"
              }`}
            >
              {achievement.unlocked ? (
                <>
                  <span className="pointer-events-none absolute -right-7 -top-7 h-20 w-20 rounded-full border border-current opacity-[0.08]" />
                  <span className={`pointer-events-none absolute right-3.5 top-3.5 inline-flex items-center gap-1 rounded-full border border-current/15 bg-white/45 px-1.5 py-0.5 text-[7px] font-extrabold uppercase tracking-[0.08em] ${tint.text}`}>
                    <Check size={8} strokeWidth={3} />
                    Earned
                  </span>
                </>
              ) : (
                <span className="absolute right-3.5 top-3.5 flex h-5 w-5 items-center justify-center rounded-full border border-[#e5ded2] bg-[#f6f1e7] text-[#a9a498]">
                  <LockKeyhole size={9} aria-hidden="true" />
                </span>
              )}

              <div
                className={`relative flex h-11 w-11 items-center justify-center rounded-[15px] border ${
                  achievement.unlocked
                    ? `${tint.iconBg} border-white/70 ${tint.text} shadow-[inset_0_0_0_1px_rgba(255,255,255,0.3)]`
                    : "border-[#e7e0d3] bg-[#f4efe5] text-[#aaa497]"
                }`}
              >
                <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
                {achievement.unlocked ? (
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#fffdf8] text-[#658465] shadow-sm ring-1 ring-[#dfe7d7]">
                    <Check size={9} strokeWidth={3} />
                  </span>
                ) : null}
              </div>

              <h3
                className={`relative mt-3 text-[13px] font-bold leading-tight tracking-[-0.02em] ${
                  achievement.unlocked ? "text-[#34372e]" : "text-[#757468]"
                }`}
              >
                {achievement.title}
              </h3>
              <p className="relative mt-1 text-[10px] leading-snug text-[#969185]">
                {achievement.description}
              </p>

              <div className="relative mt-3">
                {achievement.unlocked ? (
                  <span className={`inline-flex items-center gap-1 text-[9px] font-bold ${tint.text}`}>
                    <Sparkles size={9} aria-hidden="true" />
                    Unlocked
                  </span>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[8px] font-bold uppercase tracking-[0.08em] text-[#aaa498]">
                        Progress
                      </span>
                      <span className="tabular text-[8px] font-bold text-[#969185]">
                        {achievement.value}/{achievement.target}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#eee8dc]">
                      <div
                        className={`h-full rounded-full ${tint.bar} transition-[width] duration-500`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
  );

  if (embedded) {
    return (
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[#f9f0dc] text-[#98793e]">
              <Trophy size={14} strokeWidth={2.1} aria-hidden="true" />
            </span>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#a19b8e]">
                Proof of showing up
              </p>
              <h3 className="mt-0.5 text-[15px] font-bold tracking-[-0.025em] text-[#30332a]">
                A shelf of small wins.
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-[#e5ded1] bg-[#f8f4ec] px-2.5 py-1 text-[9px] font-bold text-[#74766a]">
              <Sparkles size={10} className="text-[#a99154]" />
              {unlocked} / {achievements.length} unlocked
            </span>
            <span className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-[#e9e2d5] sm:block">
              <span
                className="block h-full rounded-full bg-[#89a484] transition-[width] duration-500"
                style={{ width: `${completion}%` }}
              />
            </span>
          </div>
        </div>
        {grid}
      </div>
    );
  }

  return (
    <section id="achievements" className="scroll-mt-24 py-6 sm:py-9">
      <SectionHeading
        kicker="Proof of showing up"
        title="A shelf of small wins."
        description="Badges unlock from real check-ins only. No perfect week required — just the honest act of logging your days."
        icon={Trophy}
        action={
          <div className="flex items-center gap-2">
            <span className="chip">
              <Sparkles size={11} className="text-[#a99154]" />
              {unlocked} / {achievements.length} unlocked
            </span>
            <span className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-[#e9e2d5] sm:block">
              <span
                className="block h-full rounded-full bg-[#89a484] transition-[width] duration-500"
                style={{ width: `${completion}%` }}
              />
            </span>
          </div>
        }
      />
      {grid}
    </section>
  );
}
