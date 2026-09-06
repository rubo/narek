// SPDX-License-Identifier: MIT

import { useLayoutEffect, useRef } from 'react';

export default function FitHeading({ as: Heading = 'h1', children, ...props }) {
  const headingRef = useRef(null);
  const contentRef = useRef(null);

  useLayoutEffect(() => {
    const heading = headingRef.current;
    const content = contentRef.current;

    if (!heading || !content) {
      return undefined;
    }

    let frame;
    let active = true;

    const fit = () => {
      heading.style.removeProperty('--fit-heading-scale');

      const styles = getComputedStyle(heading);
      const horizontalPadding =
        Number.parseFloat(styles.paddingLeft) + Number.parseFloat(styles.paddingRight);
      const availableWidth = heading.clientWidth - horizontalPadding;
      const requiredWidth = content.scrollWidth;

      if (availableWidth > 0 && requiredWidth > availableWidth) {
        heading.style.setProperty('--fit-heading-scale', String(availableWidth / requiredWidth));
      }
    };

    const scheduleFit = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    };

    fit();

    const observer = new ResizeObserver(scheduleFit);
    observer.observe(heading);
    observer.observe(content);

    document.fonts?.ready.then(() => {
      if (active) {
        scheduleFit();
      }
    });

    return () => {
      active = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [children]);

  return (
    <Heading ref={headingRef} {...props}>
      <span ref={contentRef} className="inline-block max-w-full">
        {children}
      </span>
    </Heading>
  );
}
