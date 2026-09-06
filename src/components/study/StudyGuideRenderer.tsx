import { motion } from "framer-motion";
import { Check, FileText } from "lucide-react";
import type { StudyGuide } from "../../types/study";

interface Props {
  guide: StudyGuide;
}

export default function StudyGuideRenderer({ guide }: Props) {
  return (
    <div className="mx-auto max-w-3xl">
      {/* Intro / summary card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[26px] bg-[#17201d] p-7 text-white sm:p-9"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d8f36a] text-[#17201d]">
            <FileText className="h-5 w-5" />
          </span>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#d8f36a]">
            {guide.title ?? "Your study guide"}
          </p>
        </div>
        <p className="mt-5 text-lg font-bold leading-relaxed tracking-[-0.01em] text-white/90 sm:text-xl">
          {guide.summary}
        </p>
      </motion.div>

      {/* Sections */}
      <div className="mt-8 space-y-6">
        {guide.sections.map((section, index) => (
          <motion.section
            key={index}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-[22px] border border-[#17201d]/10 bg-white p-6 sm:p-8"
          >
            <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#ef5f47]">
              {section.heading}
            </h2>
            <p className="mt-3 text-base font-medium leading-7 text-[#17201d] sm:text-lg sm:leading-8">
              {section.body}
            </p>
            {section.bulletPoints && section.bulletPoints.length > 0 && (
              <ul className="mt-5 space-y-3">
                {section.bulletPoints.map((point, pointIndex) => (
                  <li key={pointIndex} className="flex items-start gap-3 text-sm leading-6 text-[#37433d]">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d8f36a]">
                      <Check className="h-3 w-3 text-[#17201d]" strokeWidth={3} />
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            )}
          </motion.section>
        ))}
      </div>
    </div>
  );
}