import React from 'react';
import type { RoadmapCatalogItem } from '../../../types';
import RoadmapCard from './RoadmapCard';

interface RoadmapGridProps {
  roadmaps: RoadmapCatalogItem[];
}

const RoadmapGrid: React.FC<RoadmapGridProps> = ({ roadmaps }) => {
  return (
    <div className="srp__grid">
      {roadmaps.map((roadmap) => (
        <RoadmapCard key={roadmap.id} roadmap={roadmap} />
      ))}
    </div>
  );
};

export default RoadmapGrid;
