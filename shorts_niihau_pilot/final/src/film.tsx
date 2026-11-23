import React from "react";
import { Composition, registerRoot } from "remotion";
import { NiihauFilm, FILM_FRAMES } from "./videos/film/Niihau";
const Root: React.FC = () => <Composition id="NiihauFilm" component={NiihauFilm} durationInFrames={FILM_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(Root);
