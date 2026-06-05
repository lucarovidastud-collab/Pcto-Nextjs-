"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

export const easePremium = [0.22, 1, 0.36, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easePremium }
  }
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.45, ease: easePremium } }
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.55, ease: easePremium }
  }
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: easePremium }
  }
};

export function stagger(staggerChildren = 0.09, delayChildren = 0.06): Variants {
  return {
    hidden: {},
    visible: {
      transition: { staggerChildren, delayChildren }
    }
  };
}

const viewport = { once: true, amount: 0.12 as const, margin: "0px 0px -48px 0px" };

type RevealProps = {
  children: ReactNode;
  className?: string;
  variants?: Variants;
  delay?: number;
  as?: "div" | "section" | "nav";
};

export function MotionReveal({
  children,
  className,
  variants = fadeUp,
  delay = 0,
  as = "div"
}: RevealProps) {
  const reduce = useReducedMotion();
  const Tag = as === "section" ? motion.section : as === "nav" ? motion.nav : motion.div;

  if (reduce) {
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }

  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={variants}
      transition={{ delay }}
    >
      {children}
    </Tag>
  );
}

type StaggerProps = {
  children: ReactNode;
  className?: string;
  staggerChildren?: number;
  as?: "div" | "ul" | "ol" | "tbody";
};

export function MotionStagger({
  children,
  className,
  staggerChildren = 0.09,
  as = "div"
}: StaggerProps) {
  const reduce = useReducedMotion();
  const Static = as;
  if (reduce) return <Static className={className}>{children}</Static>;

  const Component =
    as === "ul" ? motion.ul : as === "ol" ? motion.ol : as === "tbody" ? motion.tbody : motion.div;

  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={stagger(staggerChildren)}
    >
      {children}
    </Component>
  );
}

type ItemProps = {
  children: ReactNode;
  className?: string;
  variants?: Variants;
};

export function MotionItem({ children, className, variants = fadeUp }: ItemProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={variants}>
      {children}
    </motion.div>
  );
}

export function MotionLi({
  children,
  className,
  variants = slideInLeft
}: {
  children: ReactNode;
  className?: string;
  variants?: Variants;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <li className={className}>{children}</li>;
  return (
    <motion.li className={className} variants={variants}>
      {children}
    </motion.li>
  );
}

export function MotionHoverCard({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      variants={scaleIn}
      whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.22 } }}
      whileTap={{ scale: 0.99 }}
    >
      {children}
    </motion.div>
  );
}

export function MotionTableRow({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <tr className={className}>{children}</tr>;
  return (
    <motion.tr className={className} variants={fadeIn}>
      {children}
    </motion.tr>
  );
}

export function MotionSparkle({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <span className={className}>{children}</span>;
  return (
    <motion.span
      className={className}
      animate={{ rotate: [0, 8, -6, 0], scale: [1, 1.12, 1] }}
      transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.span>
  );
}
