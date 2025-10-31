import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EventType } from '@/lib/types'
import { Cake, Balloon, CalendarBlank } from '@phosphor-icons/react'

interface EventFilterProps {
  selectedType: EventType | 'all'
  onTypeChange: (type: EventType | 'all') => void
}

export function EventFilter({ selectedType, onTypeChange }: EventFilterProps) {
  return (
    <Tabs value={selectedType} onValueChange={(value) => onTypeChange(value as EventType | 'all')}>
      <TabsList>
        <TabsTrigger value="all" className="gap-2">
          <CalendarBlank size={16} weight="fill" />
          All Events
        </TabsTrigger>
        <TabsTrigger value="birthday" className="gap-2">
          <Cake size={16} weight="fill" />
          Birthdays
        </TabsTrigger>
        <TabsTrigger value="special-day" className="gap-2">
          <Balloon size={16} weight="fill" />
          Special Days
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
