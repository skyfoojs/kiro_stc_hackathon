import { useEffect, useRef, useState, type RefObject } from 'react';

import type { Selection } from '@/lib/command/building3d/types';

import { BuildingScene, type HoverInfo, type SceneView } from './BuildingScene';
import FallbackStack from './FallbackStack';

export interface SceneApi {
  focusFloor: (f: number) => void;
  focusEntity: (id: string) => void;
  resetCamera: () => void;
}

interface Props {
  view: SceneView;
  resets: number;
  apiRef: RefObject<SceneApi | null>;
  onSelect: (s: Selection | null) => void;
  onHover: (h: HoverInfo | null) => void;
}

/** Null when WebGL is available, otherwise a short reason. */
function webglProblem(): string | null {
  try {
    const c = document.createElement('canvas');
    return c.getContext('webgl2') || c.getContext('webgl') ? null : 'WebGL is not available';
  } catch {
    return 'WebGL is not available';
  }
}

/** Hosts the imperative three.js scene. Falls back to a 2D floor stack if WebGL is unavailable. */
export default function BuildingCanvas({ view, resets, apiRef, onSelect, onHover }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<BuildingScene | null>(null);
  const cbs = useRef({ onSelect, onHover });
  const [failed] = useState<string | null>(webglProblem);

  useEffect(() => {
    cbs.current = { onSelect, onHover };
  });

  useEffect(() => {
    if (!host.current || failed) return;
    let s: BuildingScene;
    try {
      s = new BuildingScene(host.current, {
        onSelect: (x) => cbs.current.onSelect(x),
        onHover: (x) => cbs.current.onHover(x),
      });
    } catch {
      host.current.textContent = 'The 3D view could not start. Use the floor list on the left.';
      return;
    }
    scene.current = s;
    apiRef.current = {
      focusFloor: (f) => s.focusFloor(f),
      focusEntity: (id) => s.focusEntity(id),
      resetCamera: () => s.resetCamera(),
    };
    return () => {
      apiRef.current = null;
      scene.current = null;
      s.dispose();
    };
  }, [apiRef, failed]);

  useEffect(() => {
    scene.current?.update(view);
  }, [view]);

  useEffect(() => {
    if (resets) scene.current?.snap();
  }, [resets]);

  if (failed) {
    return (
      <div className="b3d-fallback">
        <p className="b3d-fallback-note">
          The 3D view could not start on this device ({failed}). Showing a 2D floor overview with the same live data.
        </p>
        <FallbackStack view={view} onSelect={onSelect} />
      </div>
    );
  }
  return <div ref={host} className="b3d-canvas" role="img" aria-label="Interactive 3D model of the tower. Use the floor list for a text version." />;
}
