/**
 * EnrolledCourseWrapper
 * 
 * Wrapper component for /student/courses/:enrollmentId route
 * Validates enrollment and passes data to UnifiedCourseView
 */

import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useMyEnrollments } from '../../hooks/useCourses';
import UnifiedCourseView from './UnifiedCourseView';

const EnrolledCourseWrapper: React.FC = () => {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const { data: enrollmentsData, isLoading } = useMyEnrollments();

  const enrollments = enrollmentsData?.result ?? [];
  const enrollment = enrollments.find((e) => e.id === enrollmentId);

  // Loading state
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh' 
      }}>
        <div className="spinner" />
        <p style={{ marginLeft: '1rem' }}>Đang tải...</p>
      </div>
    );
  }

  // Enrollment not found - redirect to courses list
  if (!enrollment) {
    return <Navigate to="/student/courses" replace />;
  }

  // Render unified view with enrollment context
  return (
    <UnifiedCourseView 
      courseId={enrollment.courseId}
      enrollmentId={enrollmentId}
    />
  );
};

export default EnrolledCourseWrapper;
