import { RefObject, useEffect } from 'react';
import autoAnimate from '@formkit/auto-animate';

export const useAutoAnimate = (ref: RefObject<HTMLElement>) => {
  useEffect(() => {
    if (ref.current) {
      autoAnimate(ref.current);
    }
  }, [ref]);
};
