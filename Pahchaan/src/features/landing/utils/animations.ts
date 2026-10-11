import { Variants } from "framer-motion";

export const FADE_IN: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
};

export const SLIDE_UP: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

export const STAGGER_CONTAINER: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const SCALE_IN: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};

export const SUBTLE_HOVER: Variants = {
  rest: { y: 0, boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.05)" },
  hover: { 
    y: -4, 
    boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.08)",
    transition: { duration: 0.3, ease: "easeOut" }
  }
};
