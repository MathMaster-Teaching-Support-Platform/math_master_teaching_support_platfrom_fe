import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout/DashboardLayout';
import { mockStudent } from '../../data/mockData';
import './Calendar.css';

interface CalendarEvent {
  id: number;
  title: string;
  type: 'assignment' | 'lesson' | 'exam' | 'event';
  date: string;
  time: string;
  duration: string;
  course?: string;
  description?: string;
  status?: 'upcoming' | 'completed' | 'overdue';
}

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 31)); // Jan 31, 2026
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const events: CalendarEvent[] = [
    {
      id: 1,
      title: 'Nộp bài tập Đại số',
      type: 'assignment',
      date: '2026-02-01',
      time: '23:59',
      duration: '',
      course: 'Toán 11',
      status: 'upcoming',
    },
    {
      id: 2,
      title: 'Bài học: Phương trình bậc 2',
      type: 'lesson',
      date: '2026-02-02',
      time: '14:00',
      duration: '2h',
      course: 'Toán 9',
      status: 'upcoming',
    },
    {
      id: 3,
      title: 'Kiểm tra giữa kỳ',
      type: 'exam',
      date: '2026-02-05',
      time: '09:00',
      duration: '90 phút',
      course: 'Toán 11',
      status: 'upcoming',
    },
    {
      id: 4,
      title: 'Bài học: Hình học không gian',
      type: 'lesson',
      date: '2026-02-06',
      time: '15:00',
      duration: '1.5h',
      course: 'Toán 12',
      status: 'upcoming',
    },
    {
      id: 5,
      title: 'Webinar: Mẹo giải toán nhanh',
      type: 'event',
      date: '2026-02-08',
      time: '19:00',
      duration: '1h',
      description: 'Sự kiện đặc biệt với giáo viên xuất sắc',
      status: 'upcoming',
    },
    {
      id: 6,
      title: 'Nộp bài tập Hình học',
      type: 'assignment',
      date: '2026-02-10',
      time: '23:59',
      duration: '',
      course: 'Toán 10',
      status: 'upcoming',
    },
    {
      id: 7,
      title: 'Bài học: Tích phân',
      type: 'lesson',
      date: '2026-02-12',
      time: '16:00',
      duration: '2h',
      course: 'Toán 12',
      status: 'upcoming',
    },
    {
      id: 8,
      title: 'Thi cuối kỳ',
      type: 'exam',
      date: '2026-02-15',
      time: '08:00',
      duration: '120 phút',
      course: 'Toán 11',
      status: 'upcoming',
    },
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter((event) => event.date === dateStr);
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = [
    'Tháng 1',
    'Tháng 2',
    'Tháng 3',
    'Tháng 4',
    'Tháng 5',
    'Tháng 6',
    'Tháng 7',
    'Tháng 8',
    'Tháng 9',
    'Tháng 10',
    'Tháng 11',
    'Tháng 12',
  ];
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return '📝';
      case 'lesson':
        return '📚';
      case 'exam':
        return '📋';
      case 'event':
        return '🎉';
      default:
        return '📌';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'assignment':
        return 'var(--primary-color)';
      case 'lesson':
        return 'var(--success-color)';
      case 'exam':
        return 'var(--error-color)';
      case 'event':
        return 'var(--warning-color)';
      default:
        return 'var(--gray-600)';
    }
  };

  const upcomingEvents = events
    .filter((e) => typeFilter === 'all' || e.type === typeFilter)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 8);

  return (
    <DashboardLayout
      role="student"
      user={{ name: mockStudent.name, avatar: mockStudent.avatar!, role: 'student' }}
      notificationCount={5}
    >
      <div className="calendar-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">📅 Lịch Học Tập</h1>
            <p className="page-subtitle">Quản lý thời gian biểu và deadline</p>
          </div>
          <div className="view-mode-buttons">
            <button
              className={`view-btn ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
            >
              Tháng
            </button>
            <button
              className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              Tuần
            </button>
            <button
              className={`view-btn ${viewMode === 'day' ? 'active' : ''}`}
              onClick={() => setViewMode('day')}
            >
              Ngày
            </button>
          </div>
        </div>

        <div className="calendar-container">
          <div className="calendar-section">
            {/* Calendar Header */}
            <div className="calendar-header">
              <button className="nav-btn" onClick={previousMonth}>
                ←
              </button>
              <h2 className="calendar-title">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button className="nav-btn" onClick={nextMonth}>
                →
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="calendar-grid">
              {/* Day Names */}
              {dayNames.map((day, idx) => (
                <div key={idx} className="calendar-day-name">
                  {day}
                </div>
              ))}

              {/* Empty cells before first day */}
              {Array.from({ length: startingDayOfWeek }).map((_, idx) => (
                <div key={`empty-${idx}`} className="calendar-day empty"></div>
              ))}

              {/* Days of month */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1;
                const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                const dayEvents = getEventsForDate(date);
                const isToday =
                  date.getDate() === 31 && date.getMonth() === 0 && date.getFullYear() === 2026;
                const isSelected = selectedDate?.toDateString() === date.toDateString();

                return (
                  <div
                    key={day}
                    className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${dayEvents.length > 0 ? 'has-events' : ''}`}
                    onClick={() => setSelectedDate(date)}
                  >
                    <div className="day-number">{day}</div>
                    <div className="day-events">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className="event-dot"
                          style={{ background: getTypeColor(event.type) }}
                          title={event.title}
                        ></div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="more-events">+{dayEvents.length - 3}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="events-sidebar">
            <div className="sidebar-header">
              <h3>Sự kiện sắp tới</h3>
              <select
                className="type-filter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">Tất cả</option>
                <option value="assignment">📝 Bài tập</option>
                <option value="lesson">📚 Bài học</option>
                <option value="exam">📋 Kiểm tra</option>
                <option value="event">🎉 Sự kiện</option>
              </select>
            </div>

            <div className="events-list">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="event-item"
                  style={{ borderLeftColor: getTypeColor(event.type) }}
                >
                  <div className="event-icon">{getTypeIcon(event.type)}</div>
                  <div className="event-content">
                    <h4 className="event-title">{event.title}</h4>
                    {event.course && <p className="event-course">{event.course}</p>}
                    <div className="event-time">
                      📅 {new Date(event.date).toLocaleDateString('vi-VN')}
                      {event.time && ` • 🕐 ${event.time}`}
                      {event.duration && ` • ⏱️ ${event.duration}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn btn-primary add-event-btn">➕ Thêm sự kiện</button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="calendar-stats">
          <div className="stat-item">
            <div className="stat-icon" style={{ background: getTypeColor('assignment') }}>
              📝
            </div>
            <div>
              <div className="stat-value">
                {events.filter((e) => e.type === 'assignment').length}
              </div>
              <div className="stat-label">Bài tập</div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon" style={{ background: getTypeColor('lesson') }}>
              📚
            </div>
            <div>
              <div className="stat-value">{events.filter((e) => e.type === 'lesson').length}</div>
              <div className="stat-label">Bài học</div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon" style={{ background: getTypeColor('exam') }}>
              📋
            </div>
            <div>
              <div className="stat-value">{events.filter((e) => e.type === 'exam').length}</div>
              <div className="stat-label">Kiểm tra</div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon" style={{ background: getTypeColor('event') }}>
              🎉
            </div>
            <div>
              <div className="stat-value">{events.filter((e) => e.type === 'event').length}</div>
              <div className="stat-label">Sự kiện</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Calendar;
