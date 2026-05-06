import { BarChart3, CheckCircle2, Clock3, Workflow } from 'lucide-react';
import React from 'react';

interface RoadmapHeaderProps {
  total: number;
  inProgress: number;
  completed: number;
  avgProgress: number;
}

const RoadmapHeader: React.FC<RoadmapHeaderProps> = ({
  total,
  inProgress,
  completed,
  avgProgress,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E8E6DC] flex items-center justify-center text-[#5E5D59] shrink-0">
            <Workflow className="w-5 h-5" strokeWidth={2} aria-hidden />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-[Playfair_Display] text-[22px] font-medium text-[#141413] m-0 leading-tight">
                Lộ trình học tập
              </h1>
              {total > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#E8E6DC] font-[Be_Vietnam_Pro] text-[12px] font-semibold text-[#5E5D59]">
                  {total}
                </span>
              )}
            </div>
            <p className="font-[Be_Vietnam_Pro] text-[13px] text-[#87867F] m-0 mt-0.5">
              Khám phá và theo dõi tiến trình học của bạn
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(
          [
            {
              label: 'Đang học',
              value: inProgress,
              Icon: Clock3,
              bg: 'bg-[#FFF7ED]',
              color: 'text-[#E07B39]',
            },
            {
              label: 'Hoàn thành',
              value: completed,
              Icon: CheckCircle2,
              bg: 'bg-[#ECFDF5]',
              color: 'text-[#2EAD7A]',
            },
            {
              label: 'Tiến độ TB',
              value: `${avgProgress}%`,
              Icon: BarChart3,
              bg: 'bg-[#EEF2FF]',
              color: 'text-[#4F7EF7]',
            },
          ] as const
        ).map(({ label, value, Icon, bg, color }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-[#E8E6DC] p-4 flex items-center gap-3 shadow-[rgba(0,0,0,0.04)_0px_4px_24px] hover:shadow-[0px_0px_0px_1px_#D1CFC5,rgba(0,0,0,0.06)_0px_8px_28px] hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-4 h-4 ${color}`} strokeWidth={2} aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="font-[Playfair_Display] text-[22px] font-medium text-[#141413] leading-none truncate">
                {value}
              </p>
              <p className="font-[Be_Vietnam_Pro] text-[12px] text-[#87867F] mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoadmapHeader;
