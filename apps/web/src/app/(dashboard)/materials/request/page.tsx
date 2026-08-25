import React from 'react';

export default function MaterialRequestPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">Request Materials</h1>
          <p className="text-sm text-zinc-500">Submit a request for site materials</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="p-6">
          <form className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Project / Venture</label>
                <select className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm bg-white">
                  <option>Select venture</option>
                  <option>Skyline Heights</option>
                  <option>Green Valley Residency</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Material Needed</label>
                <select className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm bg-white">
                  <option>Select material</option>
                  <option>Cement (Bags)</option>
                  <option>Steel (Tons)</option>
                  <option>Sand (Cubic Meters)</option>
                  <option>Bricks (Pieces)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Quantity Required</label>
                  <input 
                    type="number" 
                    min="1"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm"
                    placeholder="e.g. 100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Required By Date</label>
                  <input 
                    type="date" 
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Priority</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="priority" className="text-black focus:ring-black" />
                    <span className="text-sm text-zinc-700">Low</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="priority" className="text-black focus:ring-black" defaultChecked />
                    <span className="text-sm text-zinc-700">Medium</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="priority" className="text-black focus:ring-black" />
                    <span className="text-sm text-zinc-700">High</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Reason / Notes</label>
                <textarea 
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black sm:text-sm"
                  rows={3}
                  placeholder="Explain why these materials are needed..."
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
                Submit Request
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
