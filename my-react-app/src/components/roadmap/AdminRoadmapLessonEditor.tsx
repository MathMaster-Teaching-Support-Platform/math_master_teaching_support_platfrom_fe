import type { RoadmapModule } from '../../types';

interface AdminRoadmapLessonEditorProps {
  readonly modules: RoadmapModule[];
}

export default function AdminRoadmapLessonEditor(props: Readonly<AdminRoadmapLessonEditorProps>) {
  const { modules } = props;
  return (
    <section className="admin-roadmap-editor__block">
      <h3>Lessons snapshot</h3>
      {modules.map((module) => (
        <div key={`${module.id}-lessons`} className="admin-roadmap-editor__lesson-group">
          <h4>{module.title}</h4>
          <ul>
            {module.lessons.map((lesson) => (
              <li key={lesson.id}>
                {lesson.order}. {lesson.title}
              </li>
            ))}
          </ul>
        </div>
      ))}
      {modules.length === 0 && <p className="admin-roadmap-editor__hint">No lessons to display.</p>}
    </section>
  );
}
