import React from 'react';
import Link from 'next/link';

export default function CompanySettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-zinc-900">Company Settings</h1>
        <button type="button" className="px-4 py-2 bg-[#d97706] hover:bg-amber-700 text-white rounded-lg text-sm font-semibold inline-block">Save Changes</button>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-200">
          <h2 className="text-lg font-bold text-zinc-900 mb-4">General Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Company Name</label>
              <input type="text" defaultValue="Builder Management Inc." className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Support Email</label>
              <input type="email" defaultValue="support@builder.com" className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Currency</label>
                <select className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white">
                  <option>USD ($)</option>
                  <option>EUR (€)</option>
                  <option>GBP (£)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Timezone</label>
                <select className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white">
                  <option>Eastern Time (ET)</option>
                  <option>Pacific Time (PT)</option>
                  <option>UTC</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-zinc-50">
          <h2 className="text-lg font-bold text-zinc-900 mb-4">Branding</h2>
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-zinc-200 rounded-xl flex items-center justify-center border border-zinc-300 border-dashed">
              <span className="text-xs text-zinc-500 font-medium">Logo</span>
            </div>
            <div>
              <Link href="/admin/settings/upload-logo" className="px-4 py-2 bg-white border border-zinc-300 text-zinc-700 rounded-lg text-sm font-semibold hover:bg-zinc-100 inline-block">Upload New Logo</Link>
              <p className="text-xs text-zinc-500 mt-2">Recommended size: 256x256px. PNG or JPG.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
