import { useState } from 'react';
import { X, User, Lock, Users, Shield } from 'lucide-react';
import { ProfileSettings } from './settings/ProfileSettings';
import { PasswordSettings } from './settings/PasswordSettings';
import { ReferralSettings } from './settings/ReferralSettings';
import { VerificationSettings } from './settings/VerificationSettings';

interface SettingsProps {
  onClose: () => void;
}

type Tab = 'profile' | 'password' | 'referral' | 'verification';

export function Settings({ onClose }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const tabs = [
    { id: 'profile' as Tab, label: 'Profile', icon: User },
    { id: 'password' as Tab, label: 'Password', icon: Lock },
    { id: 'referral' as Tab, label: 'Referrals', icon: Users },
    { id: 'verification' as Tab, label: 'Verification', icon: Shield },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          <div className="md:w-64 border-b md:border-b-0 md:border-r border-slate-700 bg-slate-900/50">
            <nav className="p-4 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                      activeTab === tab.id
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {activeTab === 'profile' && <ProfileSettings />}
              {activeTab === 'password' && <PasswordSettings />}
              {activeTab === 'referral' && <ReferralSettings />}
              {activeTab === 'verification' && <VerificationSettings />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
