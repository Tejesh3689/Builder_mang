import React from 'react';

export default function AssignTaskPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">Assign Task</h1>
          <p className="text-sm text-zinc-500">Create and assign field work tasks to team members</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="p-6">
          <form className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Task Title</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm"
                  placeholder="e.g. Electrical wiring inspection"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Assignee</label>
                <select className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm bg-white">
                  <option>Select team member</option>
                  <option>Ravi Kumar (Electrician)</option>
                  <option>Anil Desai (Plumber)</option>
                  <option>Suresh Babu (Mason)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Start Date</label>
                  <input 
                    type="date" 
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Due Date</label>
                  <input 
                    type="date" 
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Location / Site</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm"
                  placeholder="e.g. Skyline Heights - Block A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Task Description</label>
                <textarea 
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm"
                  rows={4}
                  placeholder="Detailed instructions for the task..."
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
                Assign Task
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
