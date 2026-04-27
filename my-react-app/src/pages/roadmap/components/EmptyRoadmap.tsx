import React from 'react';
import { Map } from 'lucide-react';

const EmptyRoadmap: React.FC = () => {
  return (
    <div className="srp__empty">
      <Map className="srp__empty-icon" />
      <h3>Chưa có lộ trình nào</h3>
      <p>Hiện tại bạn chưa có lộ trình học tập nào để theo dõi.</p>
    </div>
  );
};

export default EmptyRoadmap;
