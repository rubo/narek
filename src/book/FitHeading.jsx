// SPDX-License-Identifier: MIT

import { useLayoutEffect, useRef } from 'react';

export default function FitHeading({
  as: Heading = 'h1',
  children,
  minFontSize = 'var(--text-book-lg)',
  ...props
}) {
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

      const maxFontSize = Number.parseFloat(getComputedStyle(heading).fontSize);
      heading.style.fontSize = minFontSize;
      const minimumFontSize = Number.parseFloat(getComputedStyle(heading).fontSize);
      heading.style.removeProperty('font-size');

      const previousWhiteSpace = content.style.whiteSpace;
      content.style.whiteSpace = 'nowrap';

      const styles = getComputedStyle(heading);
      const horizontalPadding =
        Number.parseFloat(styles.paddingLeft) + Number.parseFloat(styles.paddingRight);
      const availableWidth = heading.clientWidth - horizontalPadding;
      const requiredWidth = content.scrollWidth;

      if (availableWidth > 0 && requiredWidth > availableWidth) {
        const minScale = minimumFontSize / maxFontSize;
        const scale = Math.max(minScale, availableWidth / requiredWidth);
        heading.style.setProperty('--fit-heading-scale', String(scale));
      }

      content.style.whiteSpace = previousWhiteSpace;
    };

    const scheduleFit = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    };

    fit();

    const observer = new ResizeObserver(scheduleFit);
    observer.observe(heading);

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
  }, [children, minFontSize]);

  return (
    <Heading ref={headingRef} {...props}>
      <span ref={contentRef} className="inline-block max-w-full">
        {children}
      </span>
    </Heading>
  );
}
