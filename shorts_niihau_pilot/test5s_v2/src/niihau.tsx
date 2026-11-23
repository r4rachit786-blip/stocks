import React from "react";
import { Composition, registerRoot } from "remotion";
import { NiihauShot, NIIHAU_FRAMES } from "./videos/niihau/Niihau";
const Root: React.FC = () => <Composition id="NiihauShot" component={NiihauShot} durationInFrames={NIIHAU_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(Root);
