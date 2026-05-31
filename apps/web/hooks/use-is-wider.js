import { useState, useEffect } from "react";
function useIsWider(ref, pixels) {
  const [isWider, setIsWider] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setIsWider(entry.contentRect.width >= pixels);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, pixels]);
  return isWider;
}
export {
  useIsWider
};
