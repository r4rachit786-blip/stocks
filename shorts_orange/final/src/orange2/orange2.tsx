import React from "react";
import { Composition, registerRoot } from "remotion";
import { Orange2Film, ORANGE2_FRAMES } from "./videos/orange2/Orange2";
const Root: React.FC = () => <Composition id="Orange2" component={Orange2Film} durationInFrames={ORANGE2_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(Root);
