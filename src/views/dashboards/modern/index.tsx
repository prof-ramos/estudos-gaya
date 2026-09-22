import StudyActivity from '@/components/dashboards/modern/study-activity';
import StudyFocus from '@/components/dashboards/modern/study-focus';
import StudyOverviewTab from '@/components/dashboards/modern/study-overview-tab';
import StudyProgressChart from '@/components/dashboards/modern/study-progress-chart';
import StudyStats from '@/components/dashboards/modern/study-stats';
import StudyStatusChart from '@/components/dashboards/modern/study-status-chart';
import StyleDivider from '@/components/shared/StyleDivider';

/** Página inicial: visão geral do progresso no edital. */
const page = () => {
  return (
    <>
      <div className="pb-4">
        <StudyOverviewTab />
      </div>

      <div className="flex flex-col gap-4">
        <StudyStats />

        <StyleDivider />

        <StudyActivity />

        <StyleDivider />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <StudyProgressChart />
          </div>
          <div className="xl:col-span-4">
            <StudyStatusChart />
          </div>
        </div>

        <StyleDivider />

        <StudyFocus />
      </div>
    </>
  );
};

export default page;
