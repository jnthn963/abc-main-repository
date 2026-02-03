import { motion } from "framer-motion";
import { ReactNode, useState, memo } from "react";

interface StaggeredContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

interface StaggeredItemProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut" as const,
    },
  },
};

// STABILITY FIX: Only animate once on initial mount
export const StaggeredContainer = memo(function StaggeredContainer({ 
  children, 
  className = "",
  staggerDelay = 0.1 
}: StaggeredContainerProps) {
  // Track if animation has played - only animate once
  const [hasAnimated, setHasAnimated] = useState(false);

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: 0.1,
          },
        },
      }}
      initial={hasAnimated ? false : "hidden"}
      animate="visible"
      onAnimationComplete={() => {
        if (!hasAnimated) {
          setHasAnimated(true);
        }
      }}
    >
      {children}
    </motion.div>
  );
});

export const StaggeredItem = memo(function StaggeredItem({ 
  children, 
  className = "", 
  id 
}: StaggeredItemProps) {
  return (
    <motion.div className={className} id={id} variants={itemVariants}>
      {children}
    </motion.div>
  );
});

export default StaggeredContainer;
