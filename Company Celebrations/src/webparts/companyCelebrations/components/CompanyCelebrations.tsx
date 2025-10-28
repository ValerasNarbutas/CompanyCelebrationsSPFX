import * as React from 'react';
import { useState, useMemo } from 'react';
import styles from './CompanyCelebrations.module.scss';
import type { ICompanyCelebrationsProps } from './ICompanyCelebrationsProps';
import { useCelebrations } from '../hooks/useCelebrations';
import { EventType, ICelebrationEvent } from '../models/ICelebrationEvent';
import { 
  Spinner, 
  SpinnerSize, 
  MessageBar, 
  MessageBarType, 
  DefaultButton, 
  PrimaryButton, 
  Dialog, 
  DialogFooter, 
  DialogType, 
  TextField, 
  Dropdown, 
  IDropdownOption, 
  Persona, 
  PersonaSize,
  IPersonaProps,
  HoverCard,
  IExpandingCardProps,
  PersonaPresence
} from '@fluentui/react';
import { PeoplePicker, IPeoplePickerContext, PrincipalType } from "@pnp/spfx-controls-react/lib/PeoplePicker";
import { Confetti, Cake } from '@phosphor-icons/react';
import { getMonthDays, getEventsForDate, getUpcomingEvents, formatEventDate } from '../utils/calendar-utils';
import { format, isSameMonth, isToday } from 'date-fns';

const CompanyCelebrations: React.FC<ICompanyCelebrationsProps> = (props) => {
  const {
    service,
    enableAddEvent,
    enableEditEvent,
    enableDeleteEvent
  } = props;

  const { events, loading, error, addEvent, updateEvent, deleteEvent } = useCelebrations(service);
  
  const [selectedFilter, setSelectedFilter] = useState<EventType | 'all'>('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ICelebrationEvent | null>(null);
  
  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formPersonId, setFormPersonId] = useState<number | undefined>();
  const [formDate, setFormDate] = useState('');
  const [formType, setFormType] = useState<EventType>('Birthday');
  const [formNotes, setFormNotes] = useState('');
  const [usePeoplePicker, setUsePeoplePicker] = useState(true);

  // People Picker context
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const peoplePickerContext: IPeoplePickerContext = {
    absoluteUrl: props.context.pageContext.web.absoluteUrl,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    msGraphClientFactory: props.context.msGraphClientFactory as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    spHttpClient: props.context.spHttpClient as any
  };

  const filteredEvents = useMemo(() => {
    if (selectedFilter === 'all') return events;
    return events.filter(event => event.EventType === selectedFilter);
  }, [events, selectedFilter]);

  const upcomingEvents = useMemo(() => getUpcomingEvents(filteredEvents, 10), [filteredEvents]);
  const monthDays = useMemo(() => getMonthDays(currentMonth), [currentMonth]);

  // Function to create persona card props for hover
  const getPersonaCardProps = (event: ICelebrationEvent): IExpandingCardProps | undefined => {
    if (!event.Person) return undefined;

    // Calculate days until event
    const eventDate = new Date(event.EventDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return {
      onRenderCompactCard: () => (
        <div style={{ 
          padding: '20px', 
          maxWidth: '320px',
          backgroundColor: '[theme:white, default: #ffffff]',
          borderRadius: '2px'
        }}>
          <Persona
            imageUrl={event.Person?.Picture}
            text={event.Person?.Title || event.Title}
            secondaryText={event.Person?.EMail}
            size={PersonaSize.size72}
            presence={PersonaPresence.none}
            styles={{
              root: { marginBottom: '16px' }
            }}
          />
          <div style={{ 
            borderTop: '1px solid #edebe9',
            paddingTop: '12px',
            fontSize: '14px',
            color: '#323130'
          }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>Event:</strong> {event.EventType}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Date:</strong> {formatEventDate(event.EventDate)}
            </div>
            {daysUntil >= 0 && (
              <div style={{ marginBottom: '8px' }}>
                <strong>Coming up:</strong> {daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
              </div>
            )}
            {event.Notes && (
              <div style={{ marginTop: '12px' }}>
                <strong>Notes:</strong>
                <div style={{ 
                  marginTop: '4px',
                  color: '#605e5c',
                  fontSize: '13px',
                  fontStyle: 'italic'
                }}>
                  {event.Notes}
                </div>
              </div>
            )}
          </div>
        </div>
      ),
      renderData: event
    };
  };

  const handleAddClick = (): void => {
    setFormTitle('');
    setFormPersonId(undefined);
    setFormDate('');
    setFormType('Birthday');
    setFormNotes('');
    setIsAddDialogOpen(true);
  };

  const handleAddSubmit = async (): Promise<void> => {
    if (!formTitle || !formDate) return;
    
    try {
      const eventData = {
        Title: formTitle,
        PersonId: formPersonId,
        EventDate: formDate,
        EventType: formType,
        Notes: formNotes || undefined
      };
      console.log('Adding event with data:', eventData);
      await addEvent(eventData);
      setIsAddDialogOpen(false);
    } catch (err) {
      console.error('Failed to add event', err);
    }
  };

  const handleEventClick = (event: ICelebrationEvent): void => {
    if (!enableEditEvent) return;
    setEditingEvent(event);
    setFormTitle(event.Title);
    setFormDate(event.EventDate);
    setFormType(event.EventType);
    setFormNotes(event.Notes || '');
    setUsePeoplePicker(event.EventType === 'Birthday');
    setFormPersonId(event.Person?.Id);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (): Promise<void> => {
    if (!editingEvent || !formTitle || !formDate) return;
    
    try {
      await updateEvent(editingEvent.Id, {
        Title: formTitle,
        PersonId: formPersonId,
        EventDate: formDate,
        EventType: formType,
        Notes: formNotes || undefined
      });
      setIsEditDialogOpen(false);
      setEditingEvent(null);
    } catch (err) {
      console.error('Failed to update event', err);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!editingEvent) return;
    
    try {
      await deleteEvent(editingEvent.Id);
      setIsEditDialogOpen(false);
      setEditingEvent(null);
    } catch (err) {
      console.error('Failed to delete event', err);
    }
  };

  const previousMonth = (): void => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = (): void => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const eventTypeOptions: IDropdownOption[] = [
    { key: 'Birthday', text: 'Birthday' },
    { key: 'Special Day', text: 'Special Day' }
  ];

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner size={SpinnerSize.large} label="Loading celebrations..." />
      </div>
    );
  }

  return (
    <div className={styles.celebrationsContainer}>
      {error && (
        <MessageBar messageBarType={MessageBarType.error} className={styles.error}>
          {error}
        </MessageBar>
      )}

      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <div className={styles.iconWrapper}>
            <Confetti size={28} weight="fill" />
          </div>
          <h1 className={styles.title}>Celebrations Calendar</h1>
        </div>
        <p className={styles.subtitle}>Never miss a birthday or special day again</p>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.filterTabs}>
          <button
            className={`${styles.filterTab} ${selectedFilter === 'all' ? styles.filterTabActive : ''}`}
            onClick={() => setSelectedFilter('all')}
          >
            All Events
          </button>
          <button
            className={`${styles.filterTab} ${selectedFilter === 'Birthday' ? styles.filterTabActive : ''}`}
            onClick={() => setSelectedFilter('Birthday')}
          >
            Birthdays
          </button>
          <button
            className={`${styles.filterTab} ${selectedFilter === 'Special Day' ? styles.filterTabActive : ''}`}
            onClick={() => setSelectedFilter('Special Day')}
          >
            Special Days
          </button>
        </div>
        
        {enableAddEvent && (
          <PrimaryButton text="Add Event" iconProps={{ iconName: 'Add' }} onClick={handleAddClick} />
        )}
      </div>

      {events.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>
            <Confetti size={40} weight="duotone" />
          </div>
          <h3 className={styles.emptyStateTitle}>No Events Yet</h3>
          <p className={styles.emptyStateText}>
            Start celebrating your team! Add your first birthday or special day to get started.
          </p>
        </div>
      ) : (
        <div className={styles.mainContent}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>{format(currentMonth, 'MMMM yyyy')}</h2>
              <div>
                <DefaultButton iconProps={{ iconName: 'ChevronLeft' }} onClick={previousMonth} />
                <DefaultButton iconProps={{ iconName: 'ChevronRight' }} onClick={nextMonth} style={{ marginLeft: 8 }} />
              </div>
            </div>

            <div className={styles.calendar}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className={styles.calendarDay}>{day}</div>
              ))}

              {monthDays.map((day, index) => {
                const dayEvents = getEventsForDate(filteredEvents, day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isCurrentDay = isToday(day);

                return (
                  <div
                    key={index}
                    className={`${styles.calendarCell} ${!isCurrentMonth ? styles.calendarCellInactive : ''} ${isCurrentDay ? styles.calendarCellToday : ''}`}
                  >
                    <div className={styles.calendarCellDate}>{format(day, 'd')}</div>
                    
                    {dayEvents.length > 0 && (
                      <div className={styles.calendarEvents}>
                        {dayEvents.slice(0, 2).map(event => {
                          const cardProps = getPersonaCardProps(event);
                          const eventContent = (
                            <div
                              key={event.Id}
                              className={`${styles.calendarEvent} ${event.EventType === 'Birthday' ? styles.calendarEventBirthday : styles.calendarEventSpecial}`}
                              onClick={() => handleEventClick(event)}
                              title={event.Title}
                            >
                              {event.Person && event.Person.Picture ? (
                                <img 
                                  src={event.Person.Picture} 
                                  alt={event.Title}
                                  className={styles.eventPersonPhoto}
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                              ) : null}
                              <span className={styles.eventTitle}>{event.Title}</span>
                            </div>
                          );

                          return cardProps ? (
                            <HoverCard
                              key={event.Id}
                              expandingCardProps={cardProps}
                              instantOpenOnClick={false}
                            >
                              {eventContent}
                            </HoverCard>
                          ) : eventContent;
                        })}
                        {dayEvents.length > 2 && (
                          <div className={styles.calendarEvent}>+{dayEvents.length - 2} more</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Upcoming Events</h2>
            
            {upcomingEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#605e5c' }}>
                No upcoming events
              </div>
            ) : (
              <div className={styles.eventsList}>
                {upcomingEvents.map(event => {
                  const cardProps = getPersonaCardProps(event);
                  const eventCard = (
                    <div
                      key={event.Id}
                      className={`${styles.eventCard} ${event.EventType === 'Birthday' ? styles.eventCardBirthday : styles.eventCardSpecial}`}
                      onClick={() => handleEventClick(event)}
                    >
                      <div className={styles.eventCardContent}>
                        {event.Person && event.Person.Picture ? (
                          <Persona
                            imageUrl={event.Person.Picture}
                            text={event.Person.Title || event.Title}
                            secondaryText={event.Person.EMail}
                            size={PersonaSize.size32}
                            hidePersonaDetails={true}
                            showSecondaryText={false}
                          />
                        ) : (
                          <div className={`${styles.eventIcon} ${event.EventType === 'Birthday' ? styles.eventIconBirthday : styles.eventIconSpecial}`}>
                            {event.EventType === 'Birthday' ? <Cake size={20} weight="fill" /> : <Confetti size={20} weight="fill" />}
                          </div>
                        )}
                        
                        <div className={styles.eventDetails}>
                          <div className={styles.eventHeader}>
                            <h3 className={styles.eventName}>{event.Title}</h3>
                          <span className={styles.eventBadge}>
                            {event.daysUntil === 0 ? 'Today!' : event.daysUntil === 1 ? 'Tomorrow' : `${event.daysUntil} days`}
                          </span>
                        </div>
                        <p className={styles.eventDate}>{formatEventDate(event.EventDate)}</p>
                        {event.Notes && (
                          <p className={styles.eventNotes}>{event.Notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  );

                  return cardProps ? (
                    <HoverCard
                      key={event.Id}
                      expandingCardProps={cardProps}
                      instantOpenOnClick={false}
                    >
                      {eventCard}
                    </HoverCard>
                  ) : eventCard;
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Event Dialog */}
      <Dialog
        hidden={!isAddDialogOpen}
        onDismiss={() => setIsAddDialogOpen(false)}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Add New Event'
        }}
        modalProps={{ isBlocking: false }}
      >
        <Dropdown
          label="Event Type"
          options={eventTypeOptions}
          selectedKey={formType}
          onChange={(_, option) => {
            setFormType(option?.key as EventType);
            const isBirthday = option?.key === 'Birthday';
            setUsePeoplePicker(isBirthday);
            if (!isBirthday) {
              setFormPersonId(undefined);
              setFormTitle('');
            }
          }}
          required
        />
        {usePeoplePicker && formType === 'Birthday' ? (
          <PeoplePicker
            context={peoplePickerContext}
            titleText="Select Person"
            personSelectionLimit={1}
            showtooltip={true}
            required={true}
            disabled={false}
            ensureUser={true}
            onChange={(items: IPersonaProps[]) => {
              console.log('People Picker onChange:', items);
              if (items && items.length > 0) {
                // The PnP PeoplePicker returns items with id property
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const personId = parseInt((items[0] as any).id || items[0].key as string);
                const personTitle = items[0].text || '';
                console.log('Selected person:', { personId, personTitle });
                setFormPersonId(personId);
                setFormTitle(personTitle);
              } else {
                setFormPersonId(undefined);
                setFormTitle('');
              }
            }}
            showHiddenInUI={false}
            principalTypes={[PrincipalType.User]}
            resolveDelay={300}
          />
        ) : (
          <TextField
            label={formType === 'Birthday' ? 'Employee Name' : 'Event Name'}
            value={formTitle}
            onChange={(_, value) => setFormTitle(value || '')}
            required
          />
        )}
        <TextField
          label="Date"
          type="date"
          value={formDate}
          onChange={(_, value) => setFormDate(value || '')}
          required
        />
        <TextField
          label="Notes (Optional)"
          multiline
          rows={3}
          value={formNotes}
          onChange={(_, value) => setFormNotes(value || '')}
        />
        <DialogFooter>
          <DefaultButton text="Cancel" onClick={() => setIsAddDialogOpen(false)} />
          <PrimaryButton text="Add" onClick={handleAddSubmit} disabled={(!formTitle && !formPersonId) || !formDate} />
        </DialogFooter>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog
        hidden={!isEditDialogOpen}
        onDismiss={() => setIsEditDialogOpen(false)}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Edit Event'
        }}
        modalProps={{ isBlocking: false }}
      >
        <Dropdown
          label="Event Type"
          options={eventTypeOptions}
          selectedKey={formType}
          onChange={(_, option) => {
            setFormType(option?.key as EventType);
            const isBirthday = option?.key === 'Birthday';
            setUsePeoplePicker(isBirthday);
            if (!isBirthday) {
              setFormPersonId(undefined);
              setFormTitle('');
            }
          }}
          required
        />
        {usePeoplePicker && formType === 'Birthday' ? (
          <PeoplePicker
            context={peoplePickerContext}
            titleText="Select Person"
            personSelectionLimit={1}
            showtooltip={true}
            required={true}
            disabled={false}
            ensureUser={true}
            onChange={(items: IPersonaProps[]) => {
              console.log('People Picker onChange:', items);
              if (items && items.length > 0) {
                // The PnP PeoplePicker returns items with id property
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const personId = parseInt((items[0] as any).id || items[0].key as string);
                const personTitle = items[0].text || '';
                console.log('Selected person:', { personId, personTitle });
                setFormPersonId(personId);
                setFormTitle(personTitle);
              } else {
                setFormPersonId(undefined);
                setFormTitle('');
              }
            }}
            showHiddenInUI={false}
            principalTypes={[PrincipalType.User]}
            resolveDelay={300}
            defaultSelectedUsers={editingEvent?.Person?.EMail ? [editingEvent.Person.EMail] : []}
          />
        ) : (
          <TextField
            label={formType === 'Birthday' ? 'Employee Name' : 'Event Name'}
            value={formTitle}
            onChange={(_, value) => setFormTitle(value || '')}
            required
          />
        )}
        <TextField
          label="Date"
          type="date"
          value={formDate}
          onChange={(_, value) => setFormDate(value || '')}
          required
        />
        <TextField
          label="Notes (Optional)"
          multiline
          rows={3}
          value={formNotes}
          onChange={(_, value) => setFormNotes(value || '')}
        />
        <DialogFooter>
          {enableDeleteEvent && (
            <DefaultButton text="Delete" onClick={handleDelete} styles={{ root: { marginRight: 'auto' } }} />
          )}
          <DefaultButton text="Cancel" onClick={() => setIsEditDialogOpen(false)} />
          <PrimaryButton text="Save Changes" onClick={handleEditSubmit} disabled={!formTitle || !formDate} />
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default CompanyCelebrations;