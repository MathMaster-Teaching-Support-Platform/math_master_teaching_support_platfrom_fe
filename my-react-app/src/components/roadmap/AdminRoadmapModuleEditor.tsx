import type { RoadmapModule } from '../../types';

interface AdminRoadmapModuleEditorProps {
  readonly modules: RoadmapModule[];
}

export default function AdminRoadmapModuleEditor(props: Readonly<AdminRoadmapModuleEditorProps>) {
  const { modules } = props;
  return (
    <section className="admin-roadmap-editor__block">
      <h3>Modules</h3>
      {modules.length === 0 && <p className="admin-roadmap-editor__hint">No modules available.</p>}
      {modules.map((module) => (
        <div key={module.id} className="admin-roadmap-editor__module">
          <strong>
            #{module.order} {module.title}
          </strong>
          <p>{module.lessons.length} lessons</p>
        </div>
      ))}
    </section>
  );
}
