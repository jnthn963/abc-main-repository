import { motion } from "framer-motion";
import { ReactNode } from "react";

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

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

export function StaggeredContainer({ 
  children, 
  className = "",
  staggerDelay = 0.1 
}: StaggeredContainerProps) {
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
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
}

export function StaggeredItem({ children, className = "", id }: StaggeredItemProps) {
  return (
    <motion.div className={className} id={id} variants={itemVariants}>
      {children}
    </motion.div>
  );
}

export default StaggeredContainer;
