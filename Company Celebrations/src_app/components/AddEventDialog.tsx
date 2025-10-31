import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Cake, Balloon } from '@phosphor-icons/react'
import { useState } from 'react'
import { CelebrationEvent, EventType } from '@/lib/types'
import { toast } from 'sonner'

interface AddEventDialogProps {
  onAdd: (event: Omit<CelebrationEvent, 'id'>) => void
}

export function AddEventDialog({ onAdd }: AddEventDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [type, setType] = useState<EventType>('birthday')
  const [notes, setNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !date) {
      toast.error('Please fill in all required fields')
      return
    }

    onAdd({
      name,
      date,
      type,
      notes: notes || undefined
    })

    setName('')
    setDate('')
    setType('birthday')
    setNotes('')
    setOpen(false)
    toast.success(`${type === 'birthday' ? 'Birthday' : 'Special day'} added!`)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus size={20} weight="bold" />
          Add Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="type">Event Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as EventType)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="birthday">
                  <div className="flex items-center gap-2">
                    <Cake size={16} weight="fill" />
                    <span>Birthday</span>
                  </div>
                </SelectItem>
                <SelectItem value="special-day">
                  <div className="flex items-center gap-2">
                    <Balloon size={16} weight="fill" />
                    <span>Special Day</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">
              {type === 'birthday' ? 'Employee Name' : 'Event Name'}
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 'birthday' ? 'John Doe' : 'Company Anniversary'}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any special notes..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Event</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
