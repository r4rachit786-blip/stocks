import React from "react";
import { Composition, registerRoot } from "remotion";
import { OrangeFilm, ORANGE_FRAMES } from "./videos/orange/Orange";
const Root: React.FC = () => <Composition id="OrangeFilm" component={OrangeFilm} durationInFrames={ORANGE_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(Root);
