import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminService } from '../services/adminService';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [applications, setApplications] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [users, setUsers] = useState([]);
  const [userFilterRole, setUserFilterRole] = useState('all');
  const [userFilterStatus, setUserFilterStatus] = useState('all');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    const statsResult = await adminService.getDashboardStats();
    if (statsResult.success) {
      setStats(statsResult.data);
    }
    setLoading(false);
  };

  const loadApplications = async (status = null) => {
    const result = await adminService.getTutorApplications(status);
    if (result.success) {
      setApplications(result.data);
    }
  };

  const loadSessions = async () => {
    const result = await adminService.getAllSessions();
    if (result.success) {
      setSessions(result.data.sessions);
    }
  };

  const loadEarnings = async () => {
    const result = await adminService.getEarningsSummary();
    if (result.success) {
      setEarnings(result.data);
    }
  };

  const loadUsers = async () => {
    const filters = {};
    if (userFilterRole !== 'all') filters.role = userFilterRole;
    if (userFilterStatus !== 'all') filters.status = userFilterStatus;

    const result = await adminService.getAllUsers(filters);
    if (result.success) {
      setUsers(result.data);
    }
  };

  useEffect(() => {
    if (activeTab === 'applications') {
      loadApplications(filterStatus === 'all' ? null : filterStatus);
    } else if (activeTab === 'sessions') {
      loadSessions();
    } else if (activeTab === 'earnings') {
      loadEarnings();
    } else if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab, filterStatus, userFilterRole, userFilterStatus]);

  const handleApprove = async (tutorId) => {
    const notes = prompt('Enter approval notes (optional):');
    const result = await adminService.updateTutorStatus(tutorId, 'approved', notes);
    if (result.success) {
      alert('Tutor approved successfully!');
      loadApplications(filterStatus === 'all' ? null : filterStatus);
      loadDashboardData(); // Refresh stats
    } else {
      alert('Failed to approve tutor: ' + result.message);
    }
  };

  const handleReject = async (tutorId) => {
    const notes = prompt('Enter rejection reason:');
    if (!notes) return;
    const result = await adminService.updateTutorStatus(tutorId, 'rejected', notes);
    if (result.success) {
      alert('Tutor application rejected');
      loadApplications(filterStatus === 'all' ? null : filterStatus);
      loadDashboardData(); // Refresh stats
    } else {
      alert('Failed to reject tutor: ' + result.message);
    }
  };

  const handleSuspendUser = async (userId, userName) => {
    const reason = prompt(`Enter reason for suspending ${userName}:`);
    if (!reason) return;

    const result = await adminService.updateUserStatus(userId, false, reason);
    if (result.success) {
      alert('User suspended successfully');
      loadUsers();
      loadDashboardData();
    } else {
      alert('Failed to suspend user: ' + result.message);
    }
  };

  const handleActivateUser = async (userId, userName) => {
    if (!confirm(`Activate user ${userName}?`)) return;

    const result = await adminService.updateUserStatus(userId, true, 'Account reactivated by admin');
    if (result.success) {
      alert('User activated successfully');
      loadUsers();
      loadDashboardData();
    } else {
      alert('Failed to activate user: ' + result.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-slate-400">Welcome back, {user?.full_name}</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8 border-b border-slate-800">
          {['dashboard', 'applications', 'sessions', 'earnings', 'users'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium capitalize transition-colors ${activeTab === tab
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-slate-400 hover:text-white'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard title="Total Students" value={stats.stats.total_students} icon="👥" />
            <StatCard title="Total Tutors" value={stats.stats.total_tutors} icon="👨‍🏫" />
            <StatCard title="Pending Applications" value={stats.stats.pending_applications} icon="📝" color="yellow" />
            <StatCard title="Total Sessions" value={stats.stats.total_sessions} icon="📚" />
            <StatCard title="Completed Sessions" value={stats.stats.completed_sessions} icon="✅" color="green" />
            <StatCard title="Total Earnings" value={`$${parseFloat(stats.stats.total_earnings).toFixed(2)}`} icon="💰" color="green" />
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div>
            <div className="mb-4 flex space-x-2">
              {['all', 'pending', 'approved', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg capitalize ${filterStatus === status
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="bg-slate-900 rounded-lg p-6 border border-slate-800">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2">{app.full_name}</h3>
                      <p className="text-slate-400 mb-2">{app.email}</p>
                      <p className="text-slate-300 mb-4">{app.bio}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-400">Hourly Rate:</span>
                          <span className="text-white ml-2">${app.hourly_rate}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Location:</span>
                          <span className="text-white ml-2">{app.location_city}, {app.location_state}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Subjects:</span>
                          <span className="text-white ml-2">{app.subjects_taught?.join(', ')}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Status:</span>
                          <span className={`ml-2 px-2 py-1 rounded text-xs ${app.approval_status === 'approved' ? 'bg-green-900 text-green-200' :
                            app.approval_status === 'rejected' ? 'bg-red-900 text-red-200' :
                              'bg-yellow-900 text-yellow-200'
                            }`}>
                            {app.approval_status}
                          </span>
                        </div>
                      </div>
                      {app.admin_notes && (
                        <div className="mt-4 p-3 bg-slate-800 rounded">
                          <p className="text-sm text-slate-400">Admin Notes:</p>
                          <p className="text-white">{app.admin_notes}</p>
                        </div>
                      )}
                    </div>
                    {app.approval_status === 'pending' && (
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleApprove(app.account_id)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(app.account_id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {applications.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  No applications found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Tutor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-slate-800/50">
                      <td className="px-6 py-4 text-sm text-white">{session.student_name}</td>
                      <td className="px-6 py-4 text-sm text-white">{session.tutor_name}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{session.subject}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{new Date(session.session_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{session.duration_hours}h</td>
                      <td className="px-6 py-4 text-sm text-green-400">${session.session_cost}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${session.status === 'completed' ? 'bg-green-900 text-green-200' :
                          session.status === 'confirmed' ? 'bg-blue-900 text-blue-200' :
                            session.status === 'cancelled' ? 'bg-red-900 text-red-200' :
                              'bg-yellow-900 text-yellow-200'
                          }`}>
                          {session.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {sessions.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                No sessions found
              </div>
            )}
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && earnings && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard title="Total Earnings" value={`$${parseFloat(earnings.summary.total_earnings || 0).toFixed(2)}`} icon="💰" color="green" />
              <StatCard title="Pending Earnings" value={`$${parseFloat(earnings.summary.pending_earnings || 0).toFixed(2)}`} icon="⏳" color="yellow" />
              <StatCard title="Completed Sessions" value={earnings.summary.completed_sessions} icon="✅" />
              <StatCard title="Avg Session Value" value={`$${parseFloat(earnings.summary.avg_session_value || 0).toFixed(2)}`} icon="📊" />
            </div>

            <h3 className="text-xl font-semibold text-white mb-4">Top Earning Tutors</h3>
            <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-800">
              <table className="w-full">
                <thead className="bg-slate-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Tutor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Sessions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Hourly Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Total Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {earnings.topTutors.map((tutor, index) => (
                    <tr key={index} className="hover:bg-slate-800/50">
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">{tutor.full_name}</div>
                        <div className="text-xs text-slate-400">{tutor.email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-white">{tutor.session_count}</td>
                      <td className="px-6 py-4 text-sm text-slate-300">${tutor.hourly_rate}/hr</td>
                      <td className="px-6 py-4 text-sm text-green-400 font-semibold">${parseFloat(tutor.total_earned).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="mb-4 flex space-x-2">
              <select
                value={userFilterRole}
                onChange={(e) => setUserFilterRole(e.target.value)}
                className="px-4 py-2 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="tutor">Tutors</option>
              </select>
              <select
                value={userFilterStatus}
                onChange={(e) => setUserFilterStatus(e.target.value)}
                className="px-4 py-2 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-800/50">
                        <td className="px-6 py-4">
                          <div className="text-sm text-white font-medium">{user.full_name}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">{user.email}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${user.role === 'admin' ? 'bg-purple-900 text-purple-200' :
                              user.role === 'tutor' ? 'bg-blue-900 text-blue-200' :
                                'bg-green-900 text-green-200'
                            }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">
                          {new Date(user.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${user.is_active
                              ? 'bg-green-900 text-green-200'
                              : 'bg-red-900 text-red-200'
                            }`}>
                            {user.is_active ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {user.role !== 'admin' && (
                            <div className="flex space-x-2">
                              {user.is_active ? (
                                <button
                                  onClick={() => handleSuspendUser(user.id, user.full_name)}
                                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs transition-colors"
                                >
                                  Suspend
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleActivateUser(user.id, user.full_name)}
                                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs transition-colors"
                                >
                                  Activate
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {users.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  No users found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color = 'purple' }) => {
  const colors = {
    purple: 'from-purple-600 to-blue-600',
    green: 'from-green-600 to-emerald-600',
    yellow: 'from-yellow-600 to-orange-600',
    red: 'from-red-600 to-pink-600'
  };

  return (
    <div className={`bg-gradient-to-r ${colors[color]} rounded-lg p-6 text-white`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-90 mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className="text-4xl opacity-80">{icon}</div>
      </div>
    </div>
  );
};

export default AdminDashboard;
