import React from 'react';

const AvailabilityFlowDemo = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            📚 Tutor Availability & Booking Flow
          </h1>
          <p className="text-slate-400 text-lg">Complete workflow from tutor setup to student booking</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tutor Side */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">
              👨‍🏫 Tutor Side (Dr. Johnson)
            </h2>

            {/* Step 1: Dashboard */}
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800/50">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">1</div>
                <h3 className="text-white font-semibold">Access Dashboard</h3>
              </div>
              <p className="text-slate-300 text-sm mb-3">Tutor logs in and sees dashboard with navigation tabs</p>
              <div className="bg-slate-800/30 rounded-lg p-3">
                <div className="text-slate-300 text-xs font-mono">
                  Dashboard → Session Management Tab
                </div>
              </div>
            </div>

            {/* Step 2: Set Availability */}
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800/50">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">2</div>
                <h3 className="text-white font-semibold">Set Available Time Slots</h3>
              </div>
              <p className="text-slate-300 text-sm mb-3">Use TutorAvailabilityManager to create time slots</p>
              
              {/* Mock availability interface */}
              <div className="bg-slate-800/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">Monday</span>
                  <div className="flex space-x-2">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">9:00-10:00</span>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">14:00-15:00</span>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">16:00-17:00</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">Tuesday</span>
                  <div className="flex space-x-2">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">10:00-11:00</span>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">15:00-16:00</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">Wednesday</span>
                  <div className="flex space-x-2">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">9:00-10:00</span>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">17:00-18:00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Receive Notifications */}
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800/50">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm">3</div>
                <h3 className="text-white font-semibold">Receive Booking Requests</h3>
              </div>
              <p className="text-slate-300 text-sm mb-3">Notifications appear under "Today's Sessions"</p>
              
              {/* Mock notification */}
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg p-3 border border-blue-500/30">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500/30 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">3</span>
                  </div>
                  <h4 className="text-white font-medium text-sm">New Booking Requests</h4>
                </div>
                <div className="space-y-2">
                  <div className="bg-white/10 rounded-lg p-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-white font-medium text-sm">Alice Johnson</p>
                        <p className="text-blue-200 text-xs">Mathematics • Mon, Jan 15, 2024</p>
                      </div>
                      <div className="text-white text-xs">2:00 PM</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Accept/Decline */}
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800/50">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm">4</div>
                <h3 className="text-white font-semibold">Accept/Decline Requests</h3>
              </div>
              <p className="text-slate-300 text-sm mb-3">Click on request to view details and respond</p>
              <div className="flex space-x-2">
                <button className="px-3 py-1 bg-red-600/20 text-red-400 border border-red-500/30 rounded text-xs">
                  Decline
                </button>
                <button className="px-3 py-1 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded text-xs">
                  Accept & Schedule
                </button>
              </div>
            </div>
          </div>

          {/* Student Side */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">
              🎓 Student Side (Alice)
            </h2>

            {/* Step 1: Find Tutors */}
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800/50">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">1</div>
                <h3 className="text-white font-semibold">Browse Tutors</h3>
              </div>
              <p className="text-slate-300 text-sm mb-3">Student searches for tutors and sees available sessions</p>
              <div className="bg-slate-800/30 rounded-lg p-3">
                <div className="text-slate-300 text-xs font-mono">
                  Find Tutors → Dr. Johnson → Available Sessions Preview
                </div>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between bg-slate-700/30 rounded p-2">
                    <span className="text-slate-300 text-xs">Mon, Jan 15</span>
                    <span className="text-white text-xs">14:00 - 15:00</span>
                  </div>
                  <div className="flex justify-between bg-slate-700/30 rounded p-2">
                    <span className="text-slate-300 text-xs">Mon, Jan 15</span>
                    <span className="text-white text-xs">16:00 - 17:00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Book Session */}
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800/50">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">2</div>
                <h3 className="text-white font-semibold">Book Session</h3>
              </div>
              <p className="text-slate-300 text-sm mb-3">Click "Book Session" to see full availability calendar</p>
              
              {/* Mock booking page */}
              <div className="bg-slate-800/30 rounded-lg p-3">
                <div className="text-white text-sm font-medium mb-2">Select Date & Time</div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-blue-500/20 border border-blue-500/30 rounded p-2 text-center">
                    <div className="text-blue-300 text-xs font-medium">Mon 15</div>
                  </div>
                  <div className="bg-slate-700/30 border border-slate-600/30 rounded p-2 text-center">
                    <div className="text-slate-300 text-xs">Tue 16</div>
                  </div>
                  <div className="bg-slate-700/30 border border-slate-600/30 rounded p-2 text-center">
                    <div className="text-slate-300 text-xs">Wed 17</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="bg-blue-500/20 border border-blue-500/30 rounded p-2 text-center">
                    <div className="text-blue-300 text-xs">14:00 - 15:00</div>
                  </div>
                  <div className="bg-slate-700/30 border border-slate-600/30 rounded p-2 text-center">
                    <div className="text-slate-300 text-xs">16:00 - 17:00</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Send Request */}
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800/50">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm">3</div>
                <h3 className="text-white font-semibold">Send Booking Request</h3>
              </div>
              <p className="text-slate-300 text-sm mb-3">Add notes and submit request to tutor</p>
              <div className="bg-slate-800/30 rounded-lg p-3">
                <textarea 
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded p-2 text-white text-xs"
                  rows="3"
                  placeholder="Need help with calculus derivatives..."
                  disabled
                />
                <div className="mt-2 flex space-x-2">
                  <button className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded text-xs">Cancel</button>
                  <button className="px-3 py-1 bg-blue-500 text-white rounded text-xs">Send Request</button>
                </div>
              </div>
            </div>

            {/* Step 4: Get Confirmation */}
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800/50">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm">4</div>
                <h3 className="text-white font-semibold">Receive Confirmation</h3>
              </div>
              <p className="text-slate-300 text-sm mb-3">Get notification when tutor accepts the request</p>
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
                <div className="text-green-400 font-medium text-sm">✅ Session Confirmed!</div>
                <div className="text-green-200 text-xs mt-1">
                  Dr. Johnson accepted your booking request for Monday, Jan 15 at 2:00 PM
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Guide */}
        <div className="mt-12 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20">
          <h3 className="text-white font-semibold mb-4 text-center">🗺️ Navigation Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-blue-300 font-medium mb-2">For Tutors:</h4>
              <ul className="space-y-1 text-slate-300 text-sm">
                <li>• Login → Dashboard → <span className="text-white font-medium">"Session Management"</span> tab</li>
                <li>• Use TutorAvailabilityManager to set time slots</li>
                <li>• Check notifications under "Today's Sessions"</li>
                <li>• Accept/decline requests via notification modal</li>
              </ul>
            </div>
            <div>
              <h4 className="text-purple-300 font-medium mb-2">For Students:</h4>
              <ul className="space-y-1 text-slate-300 text-sm">
                <li>• Navigation: <span className="text-white font-medium">"Find Tutors"</span> → Select Tutor → "Book Session"</li>
                <li>• See available slots in tutor preview cards</li>
                <li>• Full calendar view in booking page</li>
                <li>• Submit request with notes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityFlowDemo;