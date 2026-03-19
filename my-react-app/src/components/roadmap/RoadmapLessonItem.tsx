import type { RoadmapLesson } from '../../types';
import './roadmap-lesson-item.css';

interface RoadmapLessonItemProps {
  readonly lesson: RoadmapLesson;
  readonly onMarkComplete?: (lessonId: string) => void;
}

export default function RoadmapLessonItem(props: Readonly<RoadmapLessonItemProps>) {
  const { lesson, onMarkComplete } = props;
  const canComplete = lesson.status !== 'COMPLETED' && lesson.status !== 'LOCKED';

  return (
    <li className={`roadmap-lesson-item roadmap-lesson-item--${lesson.status.toLowerCase()}`}>
      <div>
        <h5 className="roadmap-lesson-item__title">{lesson.order}. {lesson.title}</h5>
        <p className="roadmap-lesson-item__meta">{lesson.durationMinutes} mins</p>
      </div>

      {canComplete && (
        <button
          type="button"
          className="roadmap-lesson-item__action"
          onClick={() => onMarkComplete?.(lesson.id)}
        >
          Mark complete
        </button>
      )}

      {lesson.status === 'COMPLETED' && <span className="roadmap-lesson-item__done">Done</span>}
      {lesson.status === 'LOCKED' && <span className="roadmap-lesson-item__locked">Locked</span>}
    </li>
  );
}
