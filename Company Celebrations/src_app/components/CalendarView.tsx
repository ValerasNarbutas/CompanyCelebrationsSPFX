import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CelebrationEvent } from '@/lib/types'
import { getMonthDays, getEventsForDate } from '@/lib/calendar-utils'
import { format, isSameMonth, isToday } from 'date-fns'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface CalendarViewProps {
  events: CelebrationEvent[]
  onDateClick?: (date: Date, events: CelebrationEvent[]) => void
}

export function CalendarView({ events, onDateClick }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const days = getMonthDays(currentMonth)

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={previousMonth}>
            <CaretLeft size={20} />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <CaretRight size={20} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
            {day}
          </div>
        ))}

        {days.map((day, index) => {
          const dayEvents = getEventsForDate(events, day)
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isCurrentDay = isToday(day)

          return (
            <button
              key={index}
              onClick={() => dayEvents.length > 0 && onDateClick?.(day, dayEvents)}
              className={cn(
                'min-h-20 p-2 rounded-lg border transition-all',
                'hover:border-primary hover:shadow-sm',
                isCurrentMonth ? 'bg-card' : 'bg-muted/30',
                isCurrentDay && 'ring-2 ring-primary ring-offset-2',
                dayEvents.length > 0 && 'cursor-pointer',
                !isCurrentMonth && 'text-muted-foreground'
              )}
            >
              <div className="text-right text-sm font-medium mb-1">
                {format(day, 'd')}
              </div>
              
              {dayEvents.length > 0 && (
                <div className="flex flex-col gap-1">
                  {dayEvents.slice(0, 2).map(event => (
                    <div
                      key={event.id}
                      className="text-xs px-2 py-1 rounded truncate text-left"
                      style={{
                        backgroundColor: event.type === 'birthday' 
                          ? 'var(--birthday-color)' 
                          : 'var(--special-day-color)',
                        color: 'var(--secondary-foreground)'
                      }}
                    >
                      {event.name}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </Card>
  )
}
