'use client';

import { useState } from 'react';
import { removeParticipant, setParticipantRole, type LiveRoom, type PublicParticipant } from '@/lib/client-room';

type Props = {
  accessToken: string;
  roomCode: string;
  roomStatus: LiveRoom['status'];
  participants: PublicParticipant[];
  onChanged: () => Promise<void> | void;
};

export function HostModerationPanel({ accessToken, roomCode, roomStatus, participants, onChanged }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lobby = roomStatus === 'lobby';

  async function changeRole(participant: PublicParticipant, role: 'participant' | 'spectator') {
    setBusyId(participant.id);
    setError(null);
    try {
      await setParticipantRole(accessToken, roomCode, participant.id, role);
      await onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update this participant.');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(participant: PublicParticipant) {
    setBusyId(participant.id);
    setError(null);
    try {
      await removeParticipant(accessToken, roomCode, participant.id);
      setConfirmRemoveId(null);
      await onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not remove this participant.');
    } finally {
      setBusyId(null);
    }
  }

  return <details className="host-moderation">
    <summary>
      <span>Room moderation</span>
      <strong>{participants.length}</strong>
    </summary>
    <div className="host-moderation-body">
      <p className="support">Move participants to spectator only in the lobby. Removal remains available during a live game for safety or abuse control.</p>
      {!lobby && <div className="notice warning">Role changes are locked until the room returns to the lobby so active game state stays consistent.</div>}
      {error && <div className="notice warning" role="alert">{error}</div>}
      <div className="host-moderation-list">
        {participants.length === 0 && <div className="notice">No active room members to moderate.</div>}
        {participants.map((participant) => {
          const busy = busyId === participant.id;
          const confirming = confirmRemoveId === participant.id;
          return <div className="host-moderation-row" key={participant.id}>
            <div className="host-moderation-identity">
              <strong>{participant.nickname}</strong>
              <span>{participant.role} · {participant.online ? 'online' : 'reconnecting'}</span>
            </div>
            <div className="host-moderation-actions">
              {participant.role === 'spectator'
                ? <button className="btn secondary" disabled={!lobby || busy} onClick={() => void changeRole(participant, 'participant')}>Restore player</button>
                : <button className="btn secondary" disabled={!lobby || busy} onClick={() => void changeRole(participant, 'spectator')}>Make spectator</button>}
              {confirming ? <>
                <button className="btn danger" disabled={busy} onClick={() => void remove(participant)}>{busy ? 'Removing…' : 'Confirm remove'}</button>
                <button className="btn secondary" disabled={busy} onClick={() => setConfirmRemoveId(null)}>Cancel</button>
              </> : <button className="btn danger" disabled={busy} onClick={() => setConfirmRemoveId(participant.id)}>Remove</button>}
            </div>
          </div>;
        })}
      </div>
    </div>
  </details>;
}
