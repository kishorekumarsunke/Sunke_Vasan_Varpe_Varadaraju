import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { bookingService } from '../services/bookingService';
import { Modal, Button } from './ui';

const Calendar = ({ userType = 'student' }) => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calendarView, setCalendarView] = useState('month'); // 'month', 'week', 'day'

  useEffect(() => {
    loadSessions();
  }, [currentDate, userType]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      let response;
      if (userType === 'tutor') {
        response = await bookingService.getTutorBookings('confirmed');
      } else {
        response = await bookingService.getStudentBookings('confirmed');
      }
      
      // Mock sessions for development
      const mockSessions = [
        {
          id: 1,
          title: userType === 'tutor' ? 'Mathematics with Alice Johnson' : 'Mathematics Session',
          date: '2024-01-15',
          time: '14:00',
          duration: 60,
          subject: 'Mathematics',
          studentName: userType === 'tutor' ? 'Alice Johnson' : null,
          tutorName: userType === 'student' ? 'Dr. Johnson' : null,
          status: 'confirmed',
          meetingLink: 'https://meet.google.com/abc-defg-hij',
          notes: 'Calculus derivatives and chain rule'
        },
        {
          id: 2,
          title: userType === 'tutor' ? 'Physics with Bob Smith' : 'Physics Session',
          date: '2024-01-16',
          time: '16:30',
          duration: 90,
          subject: 'Physics',
          studentName: userType === 'tutor' ? 'Bob Smith' : null,
          tutorName: userType === 'student' ? 'Dr. Johnson' : null,
          status: 'confirmed',
          meetingLink: 'https://meet.google.com/xyz-uvwx-rst',
          notes: 'Quantum mechanics wave functions'
        },
        {
          id: 3,
          title: userType === 'tutor' ? 'Chemistry with Carol Davis' : 'Chemistry Session',
          date: '2024-01-17',
          time: '10:00',
          duration: 60,
          subject: 'Chemistry',
          studentName: userType === 'tutor' ? 'Carol Davis' : null,
          tutorName: userType === 'student' ? 'Dr. Johnson' : null,
          status: 'confirmed',
          meetingLink: 'https://meet.google.com/lmn-opqr-stu',
          notes: 'Organic chemistry reactions'
        }
      ];
      
      setSessions(mockSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getSessionsForDate = (date) => {
    if (!date) return [];
    
    const dateString = date.toISOString().split('T')[0];
    return sessions.filter(session => session.date === dateString);
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  const formatDuration = (duration) => {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  };

  const exportToICalendar = () => {
    const icalEvents = sessions.map(session => {
      const startDate = new Date(`${session.date}T${session.time}`);
      const endDate = new Date(startDate.getTime() + (session.duration * 60 * 1000));

      const formatICalDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      const description = userType === 'tutor' 
        ? `Tutoring session for ${session.subject} with student ${session.studentName}. Notes: ${session.notes || 'No additional notes'}`
        : `${session.subject} tutoring session with ${session.tutorName}. Notes: ${session.notes || 'No additional notes'}`;

      return [
        'BEGIN:VEVENT',
        `DTSTART:${formatICalDate(startDate)}`,
        `DTEND:${formatICalDate(endDate)}`,
        `SUMMARY:${session.title}`,
        `DESCRIPTION:${description}`,
        `LOCATION:${session.meetingLink || 'TBD'}`,
        `UID:${session.id}@tutortogether.com`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      ].join('\r\n');
    }).join('\r\n');

    const icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Tutor Together//Calendar Export//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      icalEvents,
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sessions-${new Date().toISOString().split('T')[0]}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const SessionModal = () => (
    <Modal isOpen={showSessionModal} onClose={() => setShowSessionModal(false)}>
      <div className="p-6">
        {selectedSession && (
          <>
            <h2 className="text-xl font-bold text-white mb-6">{selectedSession.title}</h2>
            
            <div className="bg-slate-800/30 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Subject</label>
                  <p className="text-white">{selectedSession.subject}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Duration</label>
                  <p className="text-white">{formatDuration(selectedSession.duration)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Date</label>
                  <p className="text-white">{new Date(selectedSession.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Time</label>
                  <p className="text-white">{formatTime(selectedSession.time)}</p>
                </div>
              </div>
              
              {userType === 'tutor' && selectedSession.studentName && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Student</label>
                  <p className="text-white">{selectedSession.studentName}</p>
                </div>
              )}
              
              {userType === 'student' && selectedSession.tutorName && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Tutor</label>
                  <p className="text-white">{selectedSession.tutorName}</p>
                </div>
              )}
              
              {selectedSession.notes && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Session Notes</label>
                  <p className="text-slate-200 bg-slate-700/50 rounded-lg p-3">{selectedSession.notes}</p>
                </div>
              )}
              
              {selectedSession.meetingLink && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Meeting Link</label>
                  <a 
                    href={selectedSession.meetingLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    Join Session
                  </a>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => setShowSessionModal(false)}
                className="flex-1"
              >
                Close
              </Button>
              {selectedSession.meetingLink && (
                <Button
                  onClick={() => window.open(selectedSession.meetingLink, '_blank')}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                >
                  Join Session
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800/50 backdrop-blur-sm">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-white">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-white transition-colors"
            >
              ←
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-white transition-colors"
            >
              →
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-sm text-slate-400">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} this month
          </div>
          <button
            onClick={exportToICalendar}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center space-x-2"
          >
            <span>📥</span>
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day Headers */}
        {dayNames.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-slate-400">
            {day}
          </div>
        ))}
        
        {/* Calendar Days */}
        {getDaysInMonth(currentDate).map((date, index) => {
          const sessionsForDay = getSessionsForDate(date);
          const isToday = date && date.toDateString() === new Date().toDateString();
          
          return (
            <div
              key={index}
              className={`min-h-[100px] p-2 border border-slate-700/30 ${
                date ? 'bg-slate-800/20 hover:bg-slate-800/40' : 'bg-slate-900/20'
              } ${isToday ? 'bg-blue-500/10 border-blue-500/30' : ''} transition-colors`}
            >
              {date && (
                <>
                  <div className={`text-sm font-medium mb-1 ${
                    isToday ? 'text-blue-400' : 'text-white'
                  }`}>
                    {date.getDate()}
                  </div>
                  
                  {/* Sessions for this day */}
                  <div className="space-y-1">
                    {sessionsForDay.slice(0, 3).map(session => (
                      <button
                        key={session.id}
                        onClick={() => {
                          setSelectedSession(session);
                          setShowSessionModal(true);
                        }}
                        className="w-full text-left p-1 rounded bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 hover:from-blue-500/30 hover:to-purple-500/30 transition-colors"
                      >
                        <div className="text-xs text-blue-300 font-medium truncate">
                          {formatTime(session.time)}
                        </div>
                        <div className="text-xs text-slate-300 truncate">
                          {session.subject}
                        </div>
                      </button>
                    ))}
                    
                    {sessionsForDay.length > 3 && (
                      <div className="text-xs text-slate-400 text-center">
                        +{sessionsForDay.length - 3} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-slate-900/50 rounded-2xl flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <SessionModal />
    </div>
  );
};

export default Calendar;