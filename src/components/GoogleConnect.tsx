import React, { useState, useEffect } from 'react';
import { Link2, Unlink, CheckCircle2, Loader2 } from 'lucide-react';
import { initiateGoogleAuth, isGoogleConnected, disconnectGoogle } from '../lib/googleAuth';

interface Props {
  onConnectionChange: (connected: boolean) => void;
}

const GoogleConnect: React.FC<Props> = ({ onConnectionChange }) => {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setLoading(true);
    const status = await isGoogleConnected();
    setConnected(status);
    onConnectionChange(status);
    setLoading(false);
  };

  const handleConnect = () => {
    initiateGoogleAuth();
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Google Calendar & Tasks?')) return;
    setDisconnecting(true);
    await disconnectGoogle();
    setConnected(false);
    onConnectionChange(false);
    setDisconnecting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-base-content/50">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Checking Google...</span>
      </div>
    );
  }

  if (connected) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-sm text-success">
          <CheckCircle2 className="w-4 h-4" />
          <span>Google Connected</span>
        </div>
        <button
          className="btn btn-ghost btn-xs text-error"
          onClick={handleDisconnect}
          disabled={disconnecting}
        >
          {disconnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlink className="w-3 h-3" />}
        </button>
      </div>
    );
  }

  return (
    <button className="btn btn-sm btn-primary gap-2" onClick={handleConnect}>
      <Link2 className="w-4 h-4" />
      Connect Google
    </button>
  );
};

export default GoogleConnect;
