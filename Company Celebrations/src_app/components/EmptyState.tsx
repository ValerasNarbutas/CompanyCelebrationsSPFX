import { motion } from 'framer-motion'
import { Confetti } from '@phosphor-icons/react'

export function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
        <Confetti size={40} weight="duotone" className="text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No Events Yet</h3>
      <p className="text-muted-foreground max-w-md">
        Start celebrating your team! Add your first birthday or special day to get started.
      </p>
    </motion.div>
  )
}
