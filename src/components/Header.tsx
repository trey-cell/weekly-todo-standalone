import React, { useState, useEffect } from 'react';
import { isGoogleConnected, connectGoogle, disconnectGoogle } from '../lib/googleAuth';
import { supabase } from '../lib/supabase';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  drivingMode: boolean;
  setDrivingMode: (v: boolean) => void;
}

const tabs = [
  { id: 'tasks', icon: '✅', label: 'Tasks' },
  { id: 'calendar', icon: '📅', label: 'Calendar' },
  { id: 'goals', icon: '🎯', label: 'Goals' },
  { id: 'projects', icon: '📊', label: 'Projects' },
  { id: 'ai', icon: '🤖', label: 'AI' },
];

export default function Header({ activeTab, setActiveTab, drivingMode, setDrivingMode }: HeaderProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    checkGoogleStatus();

    // Listen for auth state changes (e.g., after OAuth redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.provider_token) {
        setGoogleConnected(true);
        setGoogleEmail(session.user?.email || null);
      } else if (event === 'SIGNED_OUT') {
        setGoogleConnected(false);
        setGoogleEmail(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkGoogleStatus() {
    const connected = await isGoogleConnected();
    setGoogleConnected(connected);
    if (connected) {
      const { data: { session } } = await supabase.auth.getSession();
      setGoogleEmail(session?.user?.email || null);
    }
  }

  async function handleConnectGoogle() {
    try {
      await connectGoogle();
    } catch (err) {
      console.error('Failed to connect Google:', err);
    }
  }

  async function handleDisconnectGoogle() {
    await disconnectGoogle();
    setGoogleConnected(false);
    setGoogleEmail(null);
    setShowSettings(false);
  }

  return (
    <div className="bg-base-200 border-b border-base-300 safe-top">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2">
        <h1 className="text-lg font-bold">
          {isMobile ? '📋 Weekly Todo' : '📋 Weekly Todo List'}
        </h1>
        <div className="flex items-center gap-2">
          <button
            className={`btn btn-sm ${drivingMode ? 'btn-warning' : 'btn-ghost'}`}
            onClick={() => setDrivingMode(!drivingMode)}
            title="Driving Mode"
          >
            🚗{!isMobile && ' Driving'}
          </button>
          <div className="relative">
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => setShowSettings(!showSettings)}
            >
              ⚙️
            </button>
            {showSettings && (
              <div className="absolute right-0 top-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-xl p-4 z-50 min-w-[250px]">
                <h3 className="font-bold mb-2">Google Integration</h3>
                {googleConnected ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-success">●</span>
                      <span className="text-sm">Connected</span>
                    </div>
                    {googleEmail && (
                      <p className="text-xs text-base-content/60 mb-2">{googleEmail}</p>
                    )}
                    <button
                      className="btn btn-sm btn-error btn-outline w-full"
                      onClick={handleDisconnectGoogle}
                    >
                      Disconnect Google
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn btn-sm btn-primary w-full"
                    onClick={handleConnectGoogle}
                  >
                    🔗 Connect Google
                  </button>
                )}
                <div className="divider my-2"></div>
                <button
                  className="btn btn-sm btn-ghost w-full"
                  onClick={() => setShowSettings(false)}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-t border-base-300">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`flex-1 py-2 text-center transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-primary-content'
                : 'hover:bg-base-300'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="text-lg">{tab.icon}</span>
            {!isMobile && <span className="ml-1 text-sm">{tab.label}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
