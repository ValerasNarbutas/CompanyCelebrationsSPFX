import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CelebrationEvent } from '@/lib/types'
import { Cake, Balloon, Sparkle } from '@phosphor-icons/react'
import { formatEventDate } from '@/lib/calendar-utils'
import { motion } from 'framer-motion'

interface EventCardProps {
  event: CelebrationEvent & { daysUntil?: number }
  onClick?: () => void
}

export function EventCard({ event, onClick }: EventCardProps) {
  const isBirthday = event.type === 'birthday'
  const isToday = event.daysUntil === 0
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="p-4 cursor-pointer hover:shadow-md transition-shadow border-l-4"
        style={{
          borderLeftColor: isBirthday ? 'var(--birthday-color)' : 'var(--special-day-color)'
        }}
        onClick={onClick}
      >
        <div className="flex gap-3">
          <div 
            className="flex items-center justify-center w-12 h-12 rounded-full shrink-0 relative"
            style={{
              backgroundColor: isBirthday ? 'var(--birthday-color)' : 'var(--special-day-color)'
            }}
          >
            {isBirthday ? (
              <>
                <Cake size={24} weight="fill" style={{ color: 'var(--secondary-foreground)' }} />
                {isToday && (
                  <motion.div
                    className="absolute -top-1 -right-1"
                    animate={{ rotate: [0, 10, 0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkle size={16} weight="fill" style={{ color: '#FFD700' }} />
                  </motion.div>
                )}
              </>
            ) : (
              <Balloon size={24} weight="fill" style={{ color: 'oklch(1 0 0)' }} />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-lg truncate">{event.name}</h3>
              {event.daysUntil !== undefined && (
                <Badge variant="secondary" className="shrink-0 text-xs uppercase tracking-wide">
                  {event.daysUntil === 0 ? 'Today!' : event.daysUntil === 1 ? 'Tomorrow' : `${event.daysUntil} days`}
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mt-1">
              {formatEventDate(event.date)}
            </p>
            
            {event.notes && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {event.notes}
              </p>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
