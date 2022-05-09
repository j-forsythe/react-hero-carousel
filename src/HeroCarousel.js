/* Infinite maths and react spring implementation provided by https://ironeko.com/posts/ininite-carousel-with-react-spring-how-to/ */

import { a, useSprings } from "@react-spring/web";
import { PropTypes } from "prop-types";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState
} from "react";
import { useDrag } from "react-use-gesture";
import styled, { css } from "styled-components";

import useInterval from "./hooks/useInterval";
import usePageVisibility from "./hooks/usePageVisibility";
import useScrollPosition from "./hooks/useScrollPosition";
import useWindowSize from "./hooks/useWindowSize";

const CarouselWrapper = styled.div.attrs({
  "aria-roledescription": "carousel",
  role: "region"
})`
  height: 100%;
  overflow: hidden;
  position: relative;

  svg {
    &:focus {
      border: 2px solid red;
      border-radius: 2.4rem;
    }
  }

  button.carousel {
    border-radius: 50%;
    background: rgba(250, 250, 250, 0.4);
    display: flex;
    height: 3rem;
    min-width: 3rem;
    position: absolute;
    top: 40%;
    transform: translateY(-50%);
    transition: 0.5 all ease-in-out;
    z-index: 9;

    &.prev {
      left: -2rem;
    }

    &.next {
      right: -2rem;
    }

    @media (min-width: 500px) {
      height: 4rem;
      min-width: 4rem;
      svg {
        width: 2.5rem;
        height: 2.5rem;
      }
    }
  }
`;

const Scroller = styled(a.ul)`
  display: flex;
  overflow: hidden;
  position: relative;
  touch-action: pan-y;
  min-height: 100%;
  height: 50vh;
  width: 100%;

  li {
    height: 100%;
    min-width: 100vw;
    position: absolute;
    will-change: transform;
  }
`;

const DotButton = styled.button`
  min-width: unset;
  width: 1.2rem;
  height: 1.2rem;
  padding: 0;

  &:not(:disabled):focus {
    background: none;
    border: 1px solid black;
  }

  ${({ currentSlide }) =>
    currentSlide &&
    css`
      background: black;
      &:not(:disabled):focus {
        background: blueviolet;
      }
    `}

  ${({ navOnDark, currentSlide }) =>
    navOnDark &&
    css`
      border-color: white;
      ${currentSlide &&
      css`
        background: white;
      `}
    `}
`;

const HeroCarousel = ({
  ariaLabel,
  autoplay = false,
  children,
  interval = 5000,
  loop = false,
  navArrows = true,
  navDots = false,
  navOnDark = false,
  itemWidth = "full",
  onSlideChange = () => null,
  visible = 1,
  ...props
}) => {
  const wrapper = useRef(null);
  const scroller = useRef();
  const prev = useRef([0, 1]);
  const index = useRef(0);
  const slides = Array.from(children);
  const [currentSlide, setCurrentSlide] = useState(1);
  const initialState = { paused: false, stop: false, transitioning: false };
  const [state, dispatch] = useReducer(carouselReducer, initialState);
  const documentVisibility = usePageVisibility();
  const size = useWindowSize();

  if (slides.length <= 2)
    console.warn(
      "The slider doesn't handle two or less slides very well, please use it with an array of at least 3 slides in length"
    );
  const windowWidth =
    size.width ||
    window.innerWidth ||
    document.documentElement.clientWidth ||
    document.body.clientWidth;

  let width = itemWidth === "full" ? windowWidth : Math.ceil(itemWidth);

  const idx = useCallback((x, l = slides.length) => (x < 0 ? x + l : x) % l, [
    slides
  ]);

  const getPos = useCallback(
    (i, firstVis, firstVisIdx) => idx(i - firstVis + firstVisIdx),
    [idx]
  );

  // Important only if specifyng width, centers the element in the slider
  const offset = 0;

  const [springs, set] = useSprings(slides.length, (i) => ({
    x: (i < slides.length - 1 ? i : -1) * width + offset
  }));

  function carouselReducer(state, action) {
    switch (action.type) {
      case "pause":
        return {
          ...state,
          paused: true
        };
      case "play":
        return {
          ...state,
          paused: false,
          stop: false
        };
      case "stop":
        return {
          ...state,
          paused: true,
          stop: true
        };
      case "transitioning":
        return {
          ...state,
          paused: true,
          transitioning: true
        };
      case "transitionend":
        return {
          ...state,
          paused: state?.stop,
          transitioning: false
        };
      default:
        return state;
    }
  }

  const handleIcon = () => {
    if (state?.stop) {
      return "play";
    } else if (state?.transitioning) {
      return "pause";
    } else if (state?.paused) {
      return "play";
    }
    return "pause";
  };

  const runSprings = useCallback(
    (y, vy, down, xDir, cancel, xMove) => {
      // This decides if we move over to the next slide or back to the initial
      if (!down) {
        index.current +=
          ((-xMove + (width + xMove)) / width) * (xDir > 0 ? -1 : 1);
        // cancel()
      }
      if (index.current + 1 > slides.length) {
        setCurrentSlide((index.current % slides.length) + 1);
      } else if (index.current < 0) {
        setCurrentSlide(slides.length + ((index.current + 1) % slides.length));
      } else {
        setCurrentSlide(index.current + 1);
      }
      // The actual scrolling value
      const finalY = index.current * width;
      // Defines currently visible slides
      const firstVis = idx(Math.floor(finalY / width) % slides.length);
      const firstVisIdx = vy < 0 ? slides.length - visible - 1 : 1;
      set((i) => {
        const position = getPos(i, firstVis, firstVisIdx);
        const prevPosition = getPos(i, prev.current[0], prev.current[1]);
        let rank =
          firstVis -
          (finalY < 0 ? slides.length : 0) +
          position -
          firstVisIdx +
          (finalY < 0 && firstVis === 0 ? slides.length : 0);
        return {
          // x is the position of each of our slides
          x:
            (-finalY % (width * slides.length)) +
            width * rank +
            (down ? xMove : 0) +
            offset,
          // this defines if the movement is immediate
          // So when an item is moved from one end to the other we don't
          // see it moving
          immediate: vy < 0 ? prevPosition > position : prevPosition < position
        };
      });
      prev.current = [firstVis, firstVisIdx];
    },
    [idx, getPos, width, visible, set, slides.length]
  );

  const bind = useDrag(
    ({
      offset: [x],
      vxvy: [vx],
      down,
      direction: [xDir],
      cancel,
      movement: [xMove],
      event,
      dragging
    }) => {
      if (event.target.tagName === "INPUT") {
        return dispatch({ type: "stop" });
      }
      if (dragging) {
        dispatch({ type: "transitioning" });
      } else {
        dispatch({ type: "transitionend" });
      }

      return vx && runSprings(-x, -vx, down, xDir, cancel, xMove);
    },

    {
      drag: { filterTaps: true, useTouch: true, axis: "x" }
    }
  );

  const slide = (direction) => {
    index.current += direction;
    runSprings(0, direction, true, -0, () => {}, -0);
  };

  const slideTo = (destination) => {
    let direction = index.current > destination ? -1 : 1;
    index.current = destination;
    runSprings(0, direction, true, -0, () => {}, -0);
  };

  /* Pause carousel if out of view
    TODO: convert to intersection observer hook
  */
  useScrollPosition(({ scrollY }) => {
    if (scrollY > 700) {
      dispatch({ type: "pause" });
    }
  });

  useInterval(
    () => {
      if (autoplay && !state?.stop) {
        slide(1);
      }
      return;
    },
    state?.paused && autoplay ? null : interval
  );

  /* Pause autoplay on window blur */
  useEffect(() => {
    if (documentVisibility === "hidden") {
      dispatch({ type: "stop" });
    }
  }, [documentVisibility]);

  /* recalulate on page resize*/
  useEffect(() => {
    runSprings(0, 0, true, -0, () => {}, -0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width]);

  /* If rotation control paused carousel, don't allow hover to unpause */
  useLayoutEffect(() => {
    let timer;
    let scrollerRef = scroller.current;

    function handleEnter() {
      if (!state?.stop) {
        clearTimeout(timer);
        timer = setTimeout(() => {
          dispatch({ type: "pause" });
        }, 800);
      }
      return;
    }

    function handleLeave() {
      if (!state?.stop) {
        clearTimeout(timer);
        timer = setTimeout(() => {
          dispatch({ type: "play" });
        }, 800);
      }
      return;
    }

    if (scrollerRef && autoplay) {
      scrollerRef.addEventListener("mouseenter", handleEnter);
      scrollerRef.addEventListener("mouseleave", handleLeave);
      return () => {
        scrollerRef.removeEventListener("mouseenter", handleEnter);
        scrollerRef.removeEventListener("mouseleave", handleLeave);
        clearTimeout(timer);
      };
    }
  }, [autoplay, scroller, state]);

  /* Only allow tabbing through current visible slide */
  // useEffect(() => {
  //   function shouldGetFocus(ref, hidden) {
  //     const focusableEls = ref.querySelectorAll(
  //       'a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="search"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled])',
  //     )
  //     focusableEls.forEach((element) => {
  //       if (hidden) {
  //         return (element.tabIndex = '-1')
  //       }
  //       return (element.tabIndex = '0')
  //     })
  //   }

  //   scroller?.current?.children?.forEach((child, i) => {
  //     const hidden = i !== index.current
  //     shouldGetFocus(child, hidden)
  //   })
  // }, [currentSlide])

  useEffect(() => {
    onSlideChange(currentSlide);
  }, [currentSlide, onSlideChange]);

  return (
    <CarouselWrapper
      aria-label={ariaLabel}
      loop={loop}
      ref={wrapper}
      {...props}
    >
      {navDots && (
        <div
          aria-label="Choose slide to display"
          className="slide-picker-controls"
        >
          {autoplay && (
            <button
              onClick={() =>
                state?.paused
                  ? dispatch({ type: "play" })
                  : dispatch({ type: "stop" })
              }
            >
              {handleIcon()}
            </button>
          )}
          {Array.from(slides).map((item, index) => (
            <DotButton
              aria-disabled={currentSlide === index + 1}
              aria-label={`${index + 1} of ${slides.length}`}
              currentSlide={currentSlide === index + 1}
              key={index}
              onClick={() => slideTo(index)}
              className="carousel-dot"
            />
          ))}
        </div>
      )}
      <Scroller
        aria-atomic={false}
        aria-live={autoplay ? "off" : "polite"}
        className="scroller"
        id={ariaLabel}
        ref={scroller}
        {...bind()}
      >
        {springs.map(({ x }, i) => (
          <a.li
            key={i}
            style={{ width, x }}
            aria-hidden={currentSlide === i + 1}
            onFocus={() => dispatch({ type: "stop" })}
          >
            {children[i]}
          </a.li>
        ))}
      </Scroller>
      {navArrows && (
        <>
          {currentSlide === 0 && !loop ? (
            ""
          ) : (
            <button
              aria-label="Previous Slide"
              className="carousel prev"
              onClick={() => slide(-1)}
              aria-controls={scroller.id}
            >
              previous
            </button>
          )}
          {currentSlide === slides.length - 1 && !loop ? (
            ""
          ) : (
            <button
              aria-label="Next Slide"
              className="carousel next"
              onClick={() => slide(1)}
              aria-controls={scroller.id}
            >
              next
            </button>
          )}
        </>
      )}
    </CarouselWrapper>
  );
};

HeroCarousel.propTypes = {
  /* Provide an unique aria label for the carousel and an id on the slide container */
  ariaLabel: PropTypes.string.isRequired,
  autoplay: PropTypes.bool,
  interval: PropTypes.number,
  itemWidth: PropTypes.string,
  loop: PropTypes.bool,
  navArrows: PropTypes.bool,
  navDots: PropTypes.bool,
  navOnDark: PropTypes.bool,
  onSlideChange: PropTypes.func,
  visible: PropTypes.number
};

export default HeroCarousel;
