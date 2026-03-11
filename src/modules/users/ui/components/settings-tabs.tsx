'use client';

import { useState } from 'react';
import { Lock, Settings, UserRound } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ProfileForm } from './profile-form';
import { SecurityForm } from './security-form';
import { PreferencesForm } from './preferences-form';

interface SettingsTabsProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    phone: string | null;
    timezone: string | null;
    locale: string | null;
    avatarUrl: string | null;
    createdAt: Date;
  };
  providers: string[];
  hasPassword: boolean;
  preferences: {
    theme: string;
    sidebarCollapsed: boolean;
    defaultBusinessId: string | null;
  } | null;
  businesses: { id: string; name: string; logoUrl: string | null }[];
}

const TABS = [
  { id: 'profile', label: 'Perfil', icon: UserRound },
  { id: 'security', label: 'Seguridad', icon: Lock },
  { id: 'preferences', label: 'Preferencias', icon: Settings },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function SettingsTabs({ user, providers, hasPassword, preferences, businesses }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  return (
    <div className='space-y-6'>
      {/* Tab bar */}
      <div className='border-b'>
        <nav className='-mb-px flex gap-1'>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                activeTab === id
                  ? 'border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground border-transparent'
              )}
            >
              <Icon className='size-4' />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'profile' && <ProfileForm user={user} providers={providers} />}
      {activeTab === 'security' && <SecurityForm hasPassword={hasPassword} providers={providers} />}
      {activeTab === 'preferences' && <PreferencesForm preferences={preferences} businesses={businesses} />}
    </div>
  );
}
