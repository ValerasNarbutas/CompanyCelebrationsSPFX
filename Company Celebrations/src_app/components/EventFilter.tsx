import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EventType } from '@/lib/types'

interface EventFilterProps {
  selectedType: EventType | 'all'
  onTypeChange: (type: EventType | 'all') => void
}

export function EventFilter({ selectedType, onTypeChange }: EventFilterProps) {
  return (
    <Tabs value={selectedType} onValueChange={(value) => onTypeChange(value as EventType | 'all')}>
      <TabsList>
        <TabsTrigger value="all">All Events</TabsTrigger>
        <TabsTrigger value="birthday">Birthdays</TabsTrigger>
        <TabsTrigger value="special-day">Special Days</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
