import React from 'react';

export default function MarkAttendancePage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">Mark Attendance</h1>
          <p className="text-sm text-zinc-500">Record attendance for your team members</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="p-6">
          <form className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Date</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm"
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Team Member</label>
                <select className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm bg-white">
                  <option>Select a team member</option>
                  <option>Ravi Kumar (Electrician)</option>
                  <option>Anil Desai (Plumber)</option>
                  <option>Suresh Babu (Mason)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Status</label>
                <select className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm bg-white">
                  <option>Present</option>
                  <option>Absent</option>
                  <option>Late</option>
                  <option>Half Day</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Remarks (Optional)</label>
                <textarea 
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm"
                  rows={3}
                  placeholder="Any additional notes..."
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-zinc-100">
              <button 
                type="button" 
                className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md shadow-sm hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 text-sm font-medium text-white bg-black border border-transparent rounded-md shadow-sm hover:bg-zinc-800"
              >
                Save Attendance
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
