import React from 'react';
import { Composition } from 'remotion';
import { Mining } from './Mining';
import { Fishing } from './Fishing';
import { Shooting } from './Shooting';
import { CANVAS } from './theme';

export const Root: React.FC = () => {
  return (
    <>
      <Composition id="Mining" component={Mining} durationInFrames={48} fps={24} width={CANVAS} height={CANVAS} />
      <Composition id="Fishing" component={Fishing} durationInFrames={72} fps={24} width={CANVAS} height={CANVAS} />
      <Composition id="Shooting" component={Shooting} durationInFrames={60} fps={24} width={CANVAS} height={CANVAS} />
    </>
  );
};
