import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useCallback, useEffect, useState } from 'react';

import sirenSound from '@/assets/sounds/siren.wav';

// The alarm from the prototype (square wave sweeping 880 to 1320 Hz), repeated
// until the person leaves the alert or mutes it. Plays with the ringer on silent.
export function useSiren(): { on: boolean; toggle: () => void; stop: () => void } {
  const player = useAudioPlayer(sirenSound);
  const status = useAudioPlayerStatus(player);
  const [on, setOn] = useState(true);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'duckOthers' }).catch(() => {});
  }, []);

  useEffect(() => {
    if (on) {
      player.seekTo(0).catch(() => {});
      player.play();
    } else {
      player.pause();
    }
  }, [on, player]);

  // Loop: start again each time the 1.8 s siren ends.
  useEffect(() => {
    if (on && status.didJustFinish) {
      player.seekTo(0).catch(() => {});
      player.play();
    }
  }, [on, status.didJustFinish, player]);

  const toggle = useCallback(() => setOn((v) => !v), []);
  const stop = useCallback(() => setOn(false), []);
  return { on, toggle, stop };
}
