/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Adapted from:
// https://github.com/facebook/docusaurus/blob/bd9b661/packages/docusaurus-theme-classic/src/theme/hooks/useScrollPosition.ts

import { useEffect, useState } from "react";

const getScrollPosition = () => ({
  scrollX: window.pageXOffset,
  scrollY: window.pageYOffset
});

const useScrollPosition = (effect, deps = []) => {
  const [scrollPosition, setScrollPosition] = useState(getScrollPosition());

  const handleScroll = () => {
    const currentScrollPosition = getScrollPosition();

    setScrollPosition(currentScrollPosition);

    if (effect) {
      effect(currentScrollPosition);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);

    return () =>
      window.removeEventListener("scroll", handleScroll, {
        passive: true
      });
  }, deps);

  return scrollPosition;
};

export default useScrollPosition;
