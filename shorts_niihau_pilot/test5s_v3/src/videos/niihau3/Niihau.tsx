// "Niihau night test" (v3): the welcome party and the radio. Lighting from visible sources (see STUDY.md, night.ts).
// Post chain = the kit's (Bridge.tsx): InkPass (world ink, own pass) -> lens blur pre + main (thin lens, per frame
// from dofAt) -> bloom (HDR only) + NEUTRAL tone mapping + colour grade, MSAA 4. One canvas, no crossfade.
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, getInputProps, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { World } from "./world";
import { InkPass, noInkFallback } from "./ink";
import { LensBlur } from "./lensblur";
import { GradeEffect, GRADES } from "./grade";
import { TOTAL, dofAt } from "./story";

export const NIIHAU3_FRAMES = TOTAL;

/** A/B switches for test stills only (inputProps `{ post: { ink: false, ... } }`); everything is on by default */
type PostToggles = { ink: boolean; lens: boolean; bloom: boolean; grade: boolean; msaa: number };
const toggles = (): PostToggles => ({ ink: true, lens: true, bloom: true, grade: true, msaa: 4, ...((getInputProps() as { post?: Partial<PostToggles> }).post ?? {}) });

const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.62, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = b.mipmapBlurPass;
  const setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};
/** night grade: gentle S-curve, extra saturation (reference night S median 0.61), blue-violet shadow tint, and the
 *  heavy night vignette (reference corner / centre 0.46) */
const GRADE = { ky: [0, 0.085, 0.24, 0.52, 0.79, 0.93, 1], sat: [1.12, 1.16, 1.05] as [number, number, number], tintS: [0.03, 0.004] as [number, number],
  tintM: [0.008, 0] as [number, number], tintH: [-0.01, 0.006] as [number, number], vig: [0.5, 0.26] as [number, number] };
void GRADES;

const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();

const Inner: React.FC = () => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const world = useMemo(() => new World(), []);
  const on = useMemo(toggles, []);
  const fx = useMemo(() => ({
    // thin, dark-plum ink (reference world lines ~3 px at 1080 wide; at night they read navy, not black)
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera, { color: "#170f2e", widthNear: 4.2, widthFar: 2.6, strength: 0.92 }),
    lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADE, 1),
  }), [camera, scene]);
  useEffect(() => () => fx.ink.dispose(), [fx]);
  const post = useMemo(() => (
    <EffectComposer multisampling={on.msaa}>
      {on.ink ? <primitive object={fx.ink} dispose={null} /> : null}
      {on.lens ? <primitive object={fx.lens.pre} dispose={null} /> : null}
      {on.lens ? <primitive object={fx.lens.main} dispose={null} /> : null}
      {on.bloom ? <primitive object={fx.bloom} dispose={null} /> : null}
      <primitive object={fx.tone} dispose={null} />
      {on.grade ? <primitive object={fx.grade} dispose={null} /> : null}
    </EffectComposer>
  ), [fx, on]);
  const cam = camera as THREE.PerspectiveCamera;
  world.update(f, cam, scene);
  noInkFallback(world.root);
  const d = dofAt(f);
  cam.getWorldDirection(fwd);
  fpt.set(...d.focus);
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = d.cInf;
  return (
    <>
      <primitive object={world.root} dispose={null} />
      {post}
    </>
  );
};

export const NiihauNight: React.FC = () => (
  <AbsoluteFill style={{ background: "#141a5c" }}>
    <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
      camera={{ fov: 40, near: 0.1, far: 2400 }}>
      <Inner />
    </ThreeCanvas>
  </AbsoluteFill>
);
