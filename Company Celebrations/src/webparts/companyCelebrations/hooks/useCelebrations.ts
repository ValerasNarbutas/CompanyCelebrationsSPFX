import { useState, useEffect, useCallback } from 'react';
import { ICelebrationEvent, ICelebrationEventFormData, EventType } from '../models/ICelebrationEvent';
import { ICelebrationService } from '../services/ICelebrationService';

export interface UseCelebrationsReturn {
  events: ICelebrationEvent[];
  loading: boolean;
  error: string | undefined;
  addEvent: (event: ICelebrationEventFormData) => Promise<void>;
  updateEvent: (id: number, event: Partial<ICelebrationEventFormData>) => Promise<void>;
  deleteEvent: (id: number) => Promise<void>;
  refreshEvents: () => Promise<void>;
  filterByType: (type: EventType | 'all') => ICelebrationEvent[];
}

export const useCelebrations = (service: ICelebrationService): UseCelebrationsReturn => {
  const [events, setEvents] = useState<ICelebrationEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>(undefined);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(undefined);
      const fetchedEvents = await service.getEvents();
      setEvents(fetchedEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    loadEvents().catch((err) => {
      console.error('Failed to load events:', err);
    });
  }, [loadEvents]);

  const addEvent = useCallback(async (event: ICelebrationEventFormData): Promise<void> => {
    try {
      setError(undefined);
      const newEvent = await service.addEvent(event);
      setEvents(prevEvents => [...prevEvents, newEvent]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add event');
      throw err;
    }
  }, [service]);

  const updateEvent = useCallback(async (id: number, event: Partial<ICelebrationEventFormData>): Promise<void> => {
    try {
      setError(undefined);
      await service.updateEvent(id, event);
      await loadEvents(); // Refresh to get updated data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update event');
      throw err;
    }
  }, [service, loadEvents]);

  const deleteEvent = useCallback(async (id: number): Promise<void> => {
    try {
      setError(undefined);
      await service.deleteEvent(id);
      setEvents(prevEvents => prevEvents.filter(e => e.Id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event');
      throw err;
    }
  }, [service]);

  const refreshEvents = useCallback(async (): Promise<void> => {
    await loadEvents();
  }, [loadEvents]);

  const filterByType = useCallback((type: EventType | 'all'): ICelebrationEvent[] => {
    if (type === 'all') return events;
    return events.filter(event => event.EventType === type);
  }, [events]);

  return {
    events,
    loading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
    refreshEvents,
    filterByType
  };
};
