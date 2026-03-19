import type { RoadmapModule as RoadmapModuleType } from '../../types';
import RoadmapLessonItem from './RoadmapLessonItem';
import RoadmapProgressBar from './RoadmapProgressBar';
import './roadmap-module.css';

interface RoadmapModuleProps {
  readonly module: RoadmapModuleType;
  readonly onMarkLessonComplete?: (lessonId: string) => void;
}

export default function RoadmapModule(props: Readonly<RoadmapModuleProps>) {
  const { module, onMarkLessonComplete } = props;
  return (
    <section className="roadmap-module">
      <div className="roadmap-module__header">
        <h4 className="roadmap-module__title">
          Module {module.order}: {module.title}
        </h4>
        <span className="roadmap-module__badge">{module.lessons.length} lessons</span>
      </div>

      {module.description && <p className="roadmap-module__description">{module.description}</p>}

      <RoadmapProgressBar value={module.completionPercent} label="Module progress" />

      <ul className="roadmap-module__lessons">
        {module.lessons.map((lesson) => (
          <RoadmapLessonItem
            key={lesson.id}
            lesson={lesson}
            onMarkComplete={onMarkLessonComplete}
          />
        ))}
      </ul>
    </section>
  );
}
