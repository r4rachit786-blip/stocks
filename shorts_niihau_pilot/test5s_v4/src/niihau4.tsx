import React from "react";
import { Composition, registerRoot } from "remotion";
import { NiihauNight, NIIHAU3_FRAMES } from "./videos/niihau4/Niihau";
const Root: React.FC = () => <Composition id="NiihauNight" component={NiihauNight} durationInFrames={NIIHAU3_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(Root);
