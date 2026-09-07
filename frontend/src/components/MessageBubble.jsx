import { motion } from "framer-motion";

export default function MessageBubble({ role, content }) {
  const isUser = role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
          isUser
            ? "bg-moss text-white rounded-br-sm"
            : "bg-paper-raised text-ink border border-line rounded-bl-sm"
        }`}
      >
        {content}
      </div>
    </motion.div>
  );
}
