interface Coordinate {
  top: number;
  left: number;
  width: number;
  height: number;
}

const raw = (value: string) => {
  return Number(value.replace(/[^0-9.\-]/g, ""));
};
const getCoordinate = (element: Element) => {
  const coordinates = element.getBoundingClientRect();

  return {
    top: coordinates.top + (element.parentElement?.scrollTop || 0),
    left: coordinates.left + (element.parentElement?.scrollLeft || 0),
    width: coordinates.width,
    height: coordinates.height,
  };
};

const addCallbacks = (
  element: Element,
  callbacks: Array<(element: Element) => void>
) => {
  callbacks.forEach((callback) => {
    callback(element);
  });
  for (let i = 0; i < element.children.length; i++) {
    const child = element.children[i];
    if (child) {
      callbacks.forEach((callback) => {
        callback(child);
      });
    }
  }
};

const getTransitionSize = (
  element: Element,
  oldCoordinate: Coordinate,
  newCoordinate: Coordinate
) => {
  let oldWidth = oldCoordinate.width;
  let oldHeight = oldCoordinate.height;
  let newWidth = newCoordinate.width;
  let newHeight = newCoordinate.height;

  const styles = getComputedStyle(element);
  const isContentBox = styles.getPropertyValue("box-sizing") === "content-box";
  if (isContentBox) {
    const deltaY =
      raw(styles.paddingTop) +
      raw(styles.paddingBottom) +
      raw(styles.borderTopWidth) +
      raw(styles.borderBottomWidth);
    const deltaX =
      raw(styles.paddingLeft) +
      raw(styles.paddingRight) +
      raw(styles.borderLeftWidth) +
      raw(styles.borderRightWidth);
    oldWidth -= deltaX;
    oldHeight -= deltaY;
    newWidth -= deltaX;
    newHeight -= deltaY;
  }

  return {
    oldWidth,
    oldHeight,
    newWidth,
    newHeight,
  };
};

const DELETE_FLAG = "delete";
const siblingsMap = new Map();
const coordinatesMap = new Map();
export const autoAnimate = (
  el: HTMLElement,
  options: { duration: number; easing: string }
) => {
  if (getComputedStyle(el).position === "static") {
    el.style.position = "relative";
  }

  addCallbacks(el, [
    (element) => {
      coordinatesMap.set(element, getCoordinate(element));
    },
  ]);

  const getElements = (mutations: MutationRecord[]) => {
    return mutations.reduce((acc: Set<Element> | false, mutation) => {
      // 说明此次mutation是因为为了重放删除元素动画，重新插入了被删除的元素导致的，所以不需要处理
      if (!acc) return false;
      if (mutation.target instanceof Element) {
        if (!acc.has(mutation.target)) {
          acc.add(mutation.target);
          for (let i = 0; i < mutation.target.children.length; i++) {
            const child = mutation.target.children[i];
            if (!child) continue;
            if (DELETE_FLAG in child) return false;
            if (child) {
              acc.add(child);
            }
          }
        }

        if (mutation.removedNodes.length) {
          for (let i = 0; i < mutation.removedNodes.length; i++) {
            const node = mutation.removedNodes[i];
            if (DELETE_FLAG in node) return false;
            if (node instanceof Element) {
              acc.add(node);
              siblingsMap.set(node, [
                mutation.previousSibling,
                mutation.nextSibling,
              ]);
            }
          }
        }
      }
      return acc;
    }, new Set<Element>());
  };

  const add = (element: Element) => {
    const newCoordinate = getCoordinate(element);
    coordinatesMap.set(element, newCoordinate);
    const animation = element.animate(
      [
        { transform: "scale(.98)", opacity: 0 },
        { transform: "scale(0.98)", opacity: 0, offset: 0.5 },
        { transform: "scale(1)", opacity: 1 },
      ],
      {
        duration: options.duration * 1.5,
        easing: "ease-in",
      }
    );
    animation.play();
  };

  const remain = (element: Element) => {
    const oldCoordinate = coordinatesMap.get(element);
    const newCoordinate = getCoordinate(element);
    if (!oldCoordinate) return;
    const { oldWidth, oldHeight, newWidth, newHeight } = getTransitionSize(
      element,
      oldCoordinate,
      newCoordinate
    );
    const deltaX = oldCoordinate.left - newCoordinate.left;
    const deltaY = oldCoordinate.top - newCoordinate.top;
    const start = {
      transform: `translate(${deltaX}px, ${deltaY}px)`,
      height: `${oldHeight}px`,
      width: `${oldWidth}px`,
    };

    const end = {
      transform: "translate(0, 0)",
      height: `${newHeight}px`,
      width: `${newWidth}px`,
    };

    // 如果宽高没有变化，就不需要设置动画，否则会因为easing函数导致有宽高变化的问题
    if (start.height === end.height) {
      delete start.height;
      delete end.height;
    }
    if (start.width === end.width) {
      delete start.width;
      delete end.width;
    }

    const animation = element.animate([start, end], {
      duration: options.duration,
      easing: options.easing,
    });
    coordinatesMap.set(element, newCoordinate);
    animation.play();
  };
  const remove = (element: Element) => {
    if (!siblingsMap.has(element) || !coordinatesMap.has(element)) return;
    element[DELETE_FLAG] = true;
    const [pre, next] = siblingsMap.get(element)!;

    if (next?.parentElement && next.parentElement instanceof Element) {
      next.parentElement.insertBefore(element, next);
    } else if (pre?.parentElement && pre.parentElement instanceof Element) {
      pre.parentElement.appendChild(element);
    } else {
      el.appendChild(element);
    }

    const oldCoordinate = coordinatesMap.get(element)!;
    const { oldWidth: width, oldHeight: height } = getTransitionSize(
      element,
      oldCoordinate,
      oldCoordinate
    );
    const offsetParent = element.parentElement!;
    const parentStyles = getComputedStyle(offsetParent);
    const parentCoords =
      coordinatesMap.get(offsetParent) || getCoordinate(offsetParent);

    const top =
      Math.round(oldCoordinate.top - parentCoords.top) -
      raw(parentStyles.borderTopWidth);
    const left =
      Math.round(oldCoordinate.left - parentCoords.left) -
      raw(parentStyles.borderLeftWidth);

    const styleReset: Partial<CSSStyleDeclaration> = {
      position: "absolute",
      top: `${top}px`,
      left: `${left}px`,
      width: `${width}px`,
      height: `${height}px`,
      margin: "0",
      pointerEvents: "none",
      transformOrigin: "center",
      zIndex: "100",
    };

    Object.assign((element as HTMLElement).style, styleReset);
    const animation = element.animate(
      [
        {
          transform: "scale(1)",
          opacity: 1,
        },
        {
          transform: "scale(.98)",
          opacity: 0,
        },
      ],
      {
        duration: options.duration,
        easing: "ease-out",
      }
    );

    animation.play();
    animation.addEventListener("finish", () => {
      element.remove();
      coordinatesMap.delete(element);
      siblingsMap.delete(element);
    });
  };

  const animate = (element: Element) => {
    const isMounted = element.isConnected;
    const preExist = coordinatesMap.get(element);

    if (preExist && isMounted) {
      remain(element);
    } else if (!isMounted && preExist) {
      remove(element);
    } else {
      add(element);
    }
  };
  const mutation = new MutationObserver((mutations) => {
    const elements = getElements(mutations);
    if (!elements) return;
    for (const element of elements) {
      animate(element);
    }
  });

  mutation.observe(el, { childList: true });
};
