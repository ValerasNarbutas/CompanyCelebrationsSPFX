# Company Celebrations - SPFx Implementation Guide

## Table of Contents
1. [Project Setup](#project-setup)
2. [SharePoint List Configuration](#sharepoint-list-configuration)
3. [Service Layer Implementation](#service-layer-implementation)
4. [Component Migration](#component-migration)
5. [Styling Configuration](#styling-configuration)
6. [Testing Guide](#testing-guide)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## Project Setup

### Prerequisites
- Node.js 18.x LTS
- Visual Studio Code
- SharePoint Online tenant
- Global admin or site collection admin permissions

### Step 1: Install SPFx Generator

```powershell
# Install Yeoman and SPFx generator globally
npm install -g yo @microsoft/generator-sharepoint gulp-cli

# Verify installation
yo --version
```

### Step 2: Create SPFx Project

```powershell
# Create project directory
mkdir company-celebrations-spfx
cd company-celebrations-spfx

# Run SPFx generator
yo @microsoft/sharepoint

# Answer prompts:
# ? What is your solution name? company-celebrations-spfx
# ? Which type of client-side component to create? WebPart
# ? What is your Web part name? CompanyCelebrations
# ? Which template would you like to use? React
# ? Do you want to use TypeScript? Yes
```

### Step 3: Install Dependencies

```powershell
# Core dependencies
npm install @pnp/sp @pnp/logging @pnp/graph @pnp/queryable --save

# Date utilities
npm install date-fns --save

# UI Components (Option A: Keep Radix UI)
npm install @radix-ui/react-dialog @radix-ui/react-tabs @radix-ui/react-label @radix-ui/react-select @radix-ui/react-alert-dialog --save

# UI Components (Option B: Use Fluent UI - Recommended)
npm install @fluentui/react-components @fluentui/react-icons --save

# Utilities
npm install class-variance-authority clsx tailwind-merge --save

# Types
npm install @types/react @types/react-dom --save-dev
```

### Step 4: Project Structure Setup

```powershell
# Create directory structure
cd src/webparts/companyCelebrations

mkdir components/ui
mkdir services
mkdir models
mkdir utils
mkdir hooks
mkdir styles
```

---

## SharePoint List Configuration

### Method 1: Manual Creation (Recommended for Understanding)

1. **Navigate to SharePoint Site**
   - Go to your SharePoint site
   - Click "Site contents" → "New" → "List"

2. **Create List**
   - Name: `CompanyCelebrations`
   - Description: "Company celebration events including birthdays and special days"

3. **Add Custom Columns**

   ```powershell
   # Column configurations:
   
   # EventDate (Date and Time)
   - Name: EventDate
   - Type: Date and Time
   - Format: Date Only
   - Required: Yes
   
   # EventType (Choice)
   - Name: EventType
   - Type: Choice
   - Choices: Birthday, Special Day
   - Default: Birthday
   - Required: Yes
   
   # Notes (Multiple lines of text)
   - Name: Notes
   - Type: Multiple lines of text
   - Required: No
   ```

### Method 2: PowerShell Script

```powershell
# Connect to SharePoint Online
Connect-PnPOnline -Url "https://yourtenant.sharepoint.com/sites/yoursite" -Interactive

# Create list
New-PnPList -Title "CompanyCelebrations" -Template GenericList -OnQuickLaunch

# Add columns
Add-PnPField -List "CompanyCelebrations" -DisplayName "EventDate" -InternalName "EventDate" -Type DateTime -Required

Add-PnPFieldFromXml -List "CompanyCelebrations" -FieldXml '<Field Type="Choice" DisplayName="EventType" Required="TRUE" Format="Dropdown" StaticName="EventType" Name="EventType"><CHOICES><CHOICE>Birthday</CHOICE><CHOICE>Special Day</CHOICE></CHOICES><Default>Birthday</Default></Field>'

Add-PnPField -List "CompanyCelebrations" -DisplayName "Notes" -InternalName "Notes" -Type Note -Required:$false

Write-Host "List created successfully!" -ForegroundColor Green
```

### Method 3: PnP Provisioning Template

Create file: `celebration-list-template.xml`

```xml
<?xml version="1.0"?>
<pnp:Provisioning xmlns:pnp="http://schemas.dev.office.com/PnP/2023/05/ProvisioningSchema">
  <pnp:Preferences Generator="PnP PowerShell" />
  <pnp:Templates ID="CONTAINER-TEMPLATE">
    <pnp:ProvisioningTemplate ID="CelebrationList" Version="1">
      <pnp:Lists>
        <pnp:ListInstance Title="CompanyCelebrations" 
                         Description="Company celebration events" 
                         TemplateType="100" 
                         Url="Lists/CompanyCelebrations"
                         OnQuickLaunch="true">
          <pnp:Fields>
            <Field Type="DateTime" DisplayName="EventDate" Required="TRUE" StaticName="EventDate" Name="EventDate" Format="DateOnly" />
            <Field Type="Choice" DisplayName="EventType" Required="TRUE" StaticName="EventType" Name="EventType">
              <CHOICES>
                <CHOICE>Birthday</CHOICE>
                <CHOICE>Special Day</CHOICE>
              </CHOICES>
              <Default>Birthday</Default>
            </Field>
            <Field Type="Note" DisplayName="Notes" Required="FALSE" StaticName="Notes" Name="Notes" />
          </pnp:Fields>
        </pnp:ListInstance>
      </pnp:Lists>
    </pnp:ProvisioningTemplate>
  </pnp:Templates>
</pnp:Provisioning>
```

Apply template:
```powershell
Connect-PnPOnline -Url "https://yourtenant.sharepoint.com/sites/yoursite" -Interactive
Invoke-PnPSiteTemplate -Path "./celebration-list-template.xml"
```

---

## Service Layer Implementation

### Step 1: Create Models

**File**: `src/webparts/companyCelebrations/models/ICelebrationEvent.ts`

```typescript
export type EventType = 'Birthday' | 'Special Day';

export interface ICelebrationEvent {
  Id: number;
  Title: string;
  EventDate: string; // ISO date string
  EventType: EventType;
  Notes?: string;
  Created?: string;
  Modified?: string;
}

export interface ICelebrationEventFormData {
  Title: string;
  EventDate: string;
  EventType: EventType;
  Notes?: string;
}
```

### Step 2: Create Service Interface

**File**: `src/webparts/companyCelebrations/services/ICelebrationService.ts`

```typescript
import { ICelebrationEvent, ICelebrationEventFormData, EventType } from '../models/ICelebrationEvent';

export interface ICelebrationService {
  /**
   * Retrieves all celebration events from SharePoint list
   */
  getEvents(): Promise<ICelebrationEvent[]>;
  
  /**
   * Retrieves events filtered by type
   */
  getEventsByType(type: EventType): Promise<ICelebrationEvent[]>;
  
  /**
   * Adds a new celebration event
   */
  addEvent(event: ICelebrationEventFormData): Promise<ICelebrationEvent>;
  
  /**
   * Updates an existing celebration event
   */
  updateEvent(id: number, event: Partial<ICelebrationEventFormData>): Promise<void>;
  
  /**
   * Deletes a celebration event
   */
  deleteEvent(id: number): Promise<void>;
  
  /**
   * Checks if the list exists
   */
  ensureList(): Promise<boolean>;
}
```

### Step 3: Implement Service

**File**: `src/webparts/companyCelebrations/services/CelebrationService.ts`

```typescript
import { SPFI } from "@pnp/sp";
import { IList } from "@pnp/sp/lists";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/items/get-all";
import { ICelebrationEvent, ICelebrationEventFormData, EventType } from '../models/ICelebrationEvent';
import { ICelebrationService } from './ICelebrationService';

export class CelebrationService implements ICelebrationService {
  private sp: SPFI;
  private listName: string;

  constructor(sp: SPFI, listName: string = "CompanyCelebrations") {
    this.sp = sp;
    this.listName = listName;
  }

  private getList(): IList {
    return this.sp.web.lists.getByTitle(this.listName);
  }

  public async ensureList(): Promise<boolean> {
    try {
      await this.getList().select("Title")();
      return true;
    } catch (error) {
      console.error("List does not exist:", error);
      return false;
    }
  }

  public async getEvents(): Promise<ICelebrationEvent[]> {
    try {
      const items = await this.getList()
        .items
        .select("Id", "Title", "EventDate", "EventType", "Notes", "Created", "Modified")
        .orderBy("EventDate", true)
        .top(5000)();
      
      return items.map(this.mapToEvent);
    } catch (error) {
      console.error("Error fetching events:", error);
      throw new Error("Failed to fetch celebration events");
    }
  }

  public async getEventsByType(type: EventType): Promise<ICelebrationEvent[]> {
    try {
      const items = await this.getList()
        .items
        .select("Id", "Title", "EventDate", "EventType", "Notes", "Created", "Modified")
        .filter(`EventType eq '${type}'`)
        .orderBy("EventDate", true)
        .top(5000)();
      
      return items.map(this.mapToEvent);
    } catch (error) {
      console.error("Error fetching events by type:", error);
      throw new Error(`Failed to fetch ${type} events`);
    }
  }

  public async addEvent(event: ICelebrationEventFormData): Promise<ICelebrationEvent> {
    try {
      const addResult = await this.getList().items.add({
        Title: event.Title,
        EventDate: event.EventDate,
        EventType: event.EventType,
        Notes: event.Notes || null
      });

      const newItem = await addResult.item
        .select("Id", "Title", "EventDate", "EventType", "Notes", "Created", "Modified")();
      
      return this.mapToEvent(newItem);
    } catch (error) {
      console.error("Error adding event:", error);
      throw new Error("Failed to add celebration event");
    }
  }

  public async updateEvent(id: number, event: Partial<ICelebrationEventFormData>): Promise<void> {
    try {
      const updateData: any = {};
      
      if (event.Title !== undefined) updateData.Title = event.Title;
      if (event.EventDate !== undefined) updateData.EventDate = event.EventDate;
      if (event.EventType !== undefined) updateData.EventType = event.EventType;
      if (event.Notes !== undefined) updateData.Notes = event.Notes || null;

      await this.getList().items.getById(id).update(updateData);
    } catch (error) {
      console.error("Error updating event:", error);
      throw new Error("Failed to update celebration event");
    }
  }

  public async deleteEvent(id: number): Promise<void> {
    try {
      await this.getList().items.getById(id).delete();
    } catch (error) {
      console.error("Error deleting event:", error);
      throw new Error("Failed to delete celebration event");
    }
  }

  private mapToEvent(item: any): ICelebrationEvent {
    return {
      Id: item.Id,
      Title: item.Title,
      EventDate: item.EventDate,
      EventType: item.EventType,
      Notes: item.Notes,
      Created: item.Created,
      Modified: item.Modified
    };
  }
}
```

### Step 4: Initialize PnPjs in Web Part

**File**: `src/webparts/companyCelebrations/CompanyCelebrationsWebPart.ts`

```typescript
import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle,
  PropertyPaneSlider
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import * as strings from 'CompanyCelebrationsWebPartStrings';
import CompanyCelebrations from './components/CompanyCelebrations';
import { ICompanyCelebrationsProps } from './components/ICompanyCelebrationsProps';

// PnPjs imports
import { spfi, SPFx } from "@pnp/sp";
import { CelebrationService } from './services/CelebrationService';

export interface ICompanyCelebrationsWebPartProps {
  title: string;
  listName: string;
  showUpcomingCount: number;
  enableFiltering: boolean;
  enableAddEvent: boolean;
  enableEditEvent: boolean;
  enableDeleteEvent: boolean;
}

export default class CompanyCelebrationsWebPart extends BaseClientSideWebPart<ICompanyCelebrationsWebPartProps> {
  
  public render(): void {
    // Initialize PnPjs with SPFx context
    const sp = spfi().using(SPFx(this.context));
    
    // Create service instance
    const celebrationService = new CelebrationService(sp, this.properties.listName || "CompanyCelebrations");

    const element: React.ReactElement<ICompanyCelebrationsProps> = React.createElement(
      CompanyCelebrations,
      {
        context: this.context,
        celebrationService: celebrationService,
        title: this.properties.title,
        showUpcomingCount: this.properties.showUpcomingCount || 10,
        enableFiltering: this.properties.enableFiltering !== false,
        enableAddEvent: this.properties.enableAddEvent !== false,
        enableEditEvent: this.properties.enableEditEvent !== false,
        enableDeleteEvent: this.properties.enableDeleteEvent !== false,
        isDarkTheme: this.context.sdks?.microsoftTeams?.context?.theme === 'dark',
        environmentMessage: this._getEnvironmentMessage(),
        hasTeamsContext: !!this.context.sdks.microsoftTeams,
        userDisplayName: this.context.pageContext.user.displayName
      }
    );

    ReactDom.render(element, this.domElement);
  }

  private _getEnvironmentMessage(): string {
    if (!!this.context.sdks.microsoftTeams) {
      return this.context.isServedFromLocalhost ? 
        'Testing in Microsoft Teams (localhost)' : 
        'Running in Microsoft Teams';
    }
    return this.context.isServedFromLocalhost ? 
      'Testing in SharePoint workbench (localhost)' : 
      'Running in SharePoint';
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: "General Settings",
              groupFields: [
                PropertyPaneTextField('title', {
                  label: 'Web Part Title'
                }),
                PropertyPaneTextField('listName', {
                  label: 'SharePoint List Name',
                  description: 'Name of the list storing celebration events'
                }),
                PropertyPaneSlider('showUpcomingCount', {
                  label: 'Number of Upcoming Events',
                  min: 5,
                  max: 20,
                  step: 1,
                  showValue: true
                })
              ]
            },
            {
              groupName: "Feature Settings",
              groupFields: [
                PropertyPaneToggle('enableFiltering', {
                  label: 'Enable Event Filtering',
                  onText: 'On',
                  offText: 'Off'
                }),
                PropertyPaneToggle('enableAddEvent', {
                  label: 'Allow Adding Events',
                  onText: 'On',
                  offText: 'Off'
                }),
                PropertyPaneToggle('enableEditEvent', {
                  label: 'Allow Editing Events',
                  onText: 'On',
                  offText: 'Off'
                }),
                PropertyPaneToggle('enableDeleteEvent', {
                  label: 'Allow Deleting Events',
                  onText: 'On',
                  offText: 'Off'
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
```

---

## Component Migration

### Step 1: Create Custom Hook for Data

**File**: `src/webparts/companyCelebrations/hooks/useCelebrations.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { ICelebrationEvent, ICelebrationEventFormData, EventType } from '../models/ICelebrationEvent';
import { ICelebrationService } from '../services/ICelebrationService';

export interface UseCelebrationsReturn {
  events: ICelebrationEvent[];
  loading: boolean;
  error: string | null;
  addEvent: (event: ICelebrationEventFormData) => Promise<void>;
  updateEvent: (id: number, event: Partial<ICelebrationEventFormData>) => Promise<void>;
  deleteEvent: (id: number) => Promise<void>;
  refreshEvents: () => Promise<void>;
  filterByType: (type: EventType | 'all') => ICelebrationEvent[];
}

export const useCelebrations = (service: ICelebrationService): UseCelebrationsReturn => {
  const [events, setEvents] = useState<ICelebrationEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await service.getEvents();
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const addEvent = useCallback(async (event: ICelebrationEventFormData) => {
    try {
      const newEvent = await service.addEvent(event);
      setEvents(prev => [...prev, newEvent]);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to add event');
    }
  }, [service]);

  const updateEvent = useCallback(async (id: number, event: Partial<ICelebrationEventFormData>) => {
    try {
      await service.updateEvent(id, event);
      await loadEvents(); // Refresh to get updated data
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update event');
    }
  }, [service, loadEvents]);

  const deleteEvent = useCallback(async (id: number) => {
    try {
      await service.deleteEvent(id);
      setEvents(prev => prev.filter(e => e.Id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete event');
    }
  }, [service]);

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
    refreshEvents: loadEvents,
    filterByType
  };
};
```

### Step 2: Update Main Component Props

**File**: `src/webparts/companyCelebrations/components/ICompanyCelebrationsProps.ts`

```typescript
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { ICelebrationService } from '../services/ICelebrationService';

export interface ICompanyCelebrationsProps {
  context: WebPartContext;
  celebrationService: ICelebrationService;
  title: string;
  showUpcomingCount: number;
  enableFiltering: boolean;
  enableAddEvent: boolean;
  enableEditEvent: boolean;
  enableDeleteEvent: boolean;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
}
```

### Step 3: Migrate Main Component

**File**: `src/webparts/companyCelebrations/components/CompanyCelebrations.tsx`

```typescript
import * as React from 'react';
import { useState, useMemo } from 'react';
import styles from './CompanyCelebrations.module.scss';
import { ICompanyCelebrationsProps } from './ICompanyCelebrationsProps';
import { useCelebrations } from '../hooks/useCelebrations';
import { EventType } from '../models/ICelebrationEvent';

// Components (to be migrated)
import { AddEventDialog } from './AddEventDialog';
import { EditEventDialog } from './EditEventDialog';
import { CalendarView } from './CalendarView';
import { UpcomingEvents } from './UpcomingEvents';
import { EventFilter } from './EventFilter';
import { EmptyState } from './EmptyState';

const CompanyCelebrations: React.FC<ICompanyCelebrationsProps> = (props) => {
  const {
    celebrationService,
    title,
    showUpcomingCount,
    enableFiltering,
    enableAddEvent,
    enableEditEvent,
    enableDeleteEvent
  } = props;

  // Custom hook for data management
  const {
    events,
    loading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
    filterByType
  } = useCelebrations(celebrationService);

  // Local state
  const [selectedFilter, setSelectedFilter] = useState<EventType | 'all'>('all');
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return filterByType(selectedFilter);
  }, [filterByType, selectedFilter]);

  // Event handlers
  const handleAddEvent = async (newEvent: any) => {
    try {
      await addEvent({
        Title: newEvent.name,
        EventDate: newEvent.date,
        EventType: newEvent.type === 'birthday' ? 'Birthday' : 'Special Day',
        Notes: newEvent.notes
      });
    } catch (err) {
      console.error('Failed to add event:', err);
    }
  };

  const handleEditEvent = async (id: number, updatedEvent: any) => {
    try {
      await updateEvent(id, {
        Title: updatedEvent.name,
        EventDate: updatedEvent.date,
        EventType: updatedEvent.type === 'birthday' ? 'Birthday' : 'Special Day',
        Notes: updatedEvent.notes
      });
    } catch (err) {
      console.error('Failed to update event:', err);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    try {
      await deleteEvent(id);
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  const handleEventClick = (event: any) => {
    if (enableEditEvent) {
      setEditingEvent(event);
      setIsEditDialogOpen(true);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.companyCelebrations}>
        <div className={styles.loading}>Loading celebrations...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.companyCelebrations}>
        <div className={styles.error}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div className={styles.companyCelebrations}>
      <header className={styles.header}>
        <h1>{title || 'Celebrations Calendar'}</h1>
        <p>Never miss a birthday or special day again</p>
      </header>

      <div className={styles.controls}>
        {enableFiltering && (
          <EventFilter 
            selectedType={selectedFilter} 
            onTypeChange={setSelectedFilter} 
          />
        )}
        {enableAddEvent && (
          <AddEventDialog onAdd={handleAddEvent} />
        )}
      </div>

      {events.length === 0 ? (
        <EmptyState />
      ) : (
        <div className={styles.mainContent}>
          <div className={styles.calendarSection}>
            <CalendarView 
              events={filteredEvents} 
              onDateClick={(_, dayEvents) => {
                if (dayEvents.length > 0) {
                  handleEventClick(dayEvents[0]);
                }
              }}
            />
          </div>
          <div className={styles.upcomingSection}>
            <UpcomingEvents 
              events={filteredEvents} 
              onEventClick={handleEventClick}
              limit={showUpcomingCount}
            />
          </div>
        </div>
      )}

      {enableEditEvent && (
        <EditEventDialog
          event={editingEvent}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onEdit={handleEditEvent}
          onDelete={enableDeleteEvent ? handleDeleteEvent : undefined}
        />
      )}
    </div>
  );
};

export default CompanyCelebrations;
```

### Step 4: Update Utility Functions

**File**: `src/webparts/companyCelebrations/utils/calendar-utils.ts`

```typescript
import { ICelebrationEvent } from '../models/ICelebrationEvent';
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  format, 
  isSameDay, 
  startOfWeek, 
  endOfWeek,
  parseISO,
  differenceInDays,
  isLeapYear,
  getYear
} from 'date-fns';

export function getMonthDays(date: Date): Date[] {
  const start = startOfWeek(startOfMonth(date));
  const end = endOfWeek(endOfMonth(date));
  return eachDayOfInterval({ start, end });
}

export function getEventsForDate(events: ICelebrationEvent[], date: Date): ICelebrationEvent[] {
  return events.filter(event => {
    const eventDate = parseISO(event.EventDate);
    return isSameDay(eventDate, date) || 
      (format(eventDate, 'MM-dd') === format(date, 'MM-dd'));
  });
}

export interface EventWithCountdown extends ICelebrationEvent {
  nextOccurrence: Date;
  daysUntil: number;
}

export function getUpcomingEvents(events: ICelebrationEvent[], limit: number = 10): EventWithCountdown[] {
  const today = new Date();
  const currentYear = getYear(today);
  
  const eventsWithNextOccurrence = events.map(event => {
    const eventDate = parseISO(event.EventDate);
    const month = eventDate.getMonth();
    const day = eventDate.getDate();
    
    let nextOccurrence = new Date(currentYear, month, day);
    
    // Handle leap year birthdays
    if (month === 1 && day === 29 && !isLeapYear(currentYear)) {
      nextOccurrence = new Date(currentYear, 1, 28);
    }
    
    // If date has passed this year, move to next year
    if (nextOccurrence < today) {
      nextOccurrence = new Date(currentYear + 1, month, day);
      
      if (month === 1 && day === 29 && !isLeapYear(currentYear + 1)) {
        nextOccurrence = new Date(currentYear + 1, 1, 28);
      }
    }
    
    return {
      ...event,
      nextOccurrence,
      daysUntil: differenceInDays(nextOccurrence, today)
    };
  });
  
  return eventsWithNextOccurrence
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, limit);
}

export function formatEventDate(dateString: string): string {
  const date = parseISO(dateString);
  return format(date, 'MMMM d');
}
```

---

## Styling Configuration

### Option A: CSS Modules (Recommended for SPFx)

**File**: `src/webparts/companyCelebrations/components/CompanyCelebrations.module.scss`

```scss
.companyCelebrations {
  padding: 24px;
  background-color: var(--colorNeutralBackground1);
  min-height: 400px;

  .header {
    margin-bottom: 32px;
    
    h1 {
      font-size: 32px;
      font-weight: 700;
      color: var(--colorNeutralForeground1);
      margin: 0 0 8px 0;
    }
    
    p {
      font-size: 16px;
      color: var(--colorNeutralForeground2);
      margin: 0;
    }
  }

  .controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    gap: 16px;
    flex-wrap: wrap;
  }

  .mainContent {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 24px;

    @media (max-width: 1024px) {
      grid-template-columns: 1fr;
    }
  }

  .calendarSection {
    min-width: 0;
  }

  .upcomingSection {
    min-width: 0;
  }

  .loading,
  .error {
    text-align: center;
    padding: 48px;
    font-size: 18px;
  }

  .error {
    color: var(--colorPaletteRedForeground1);
  }
}
```

### Option B: Fluent UI Styling

**File**: `src/webparts/companyCelebrations/components/CompanyCelebrations.styles.ts`

```typescript
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';

export const useStyles = makeStyles({
  root: {
    ...shorthands.padding(tokens.spacingVerticalXXL),
    backgroundColor: tokens.colorNeutralBackground1,
    minHeight: '400px',
  },
  header: {
    ...shorthands.margin(0, 0, tokens.spacingVerticalXXL, 0),
  },
  title: {
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    ...shorthands.margin(0, 0, tokens.spacingVerticalS, 0),
  },
  subtitle: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground2,
    ...shorthands.margin(0),
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shorthands.margin(0, 0, tokens.spacingVerticalXXL, 0),
    ...shorthands.gap(tokens.spacingHorizontalM),
    flexWrap: 'wrap',
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    ...shorthands.gap(tokens.spacingHorizontalXXL),
    '@media (max-width: 1024px)': {
      gridTemplateColumns: '1fr',
    },
  },
  loading: {
    textAlign: 'center',
    ...shorthands.padding(tokens.spacingVerticalXXXL),
    fontSize: tokens.fontSizeBase500,
  },
  error: {
    textAlign: 'center',
    ...shorthands.padding(tokens.spacingVerticalXXXL),
    fontSize: tokens.fontSizeBase500,
    color: tokens.colorPaletteRedForeground1,
  },
});
```

---

## Testing Guide

### Unit Testing Setup

**Install Testing Dependencies:**

```powershell
npm install @testing-library/react @testing-library/jest-dom @testing-library/user-event --save-dev
```

**Example Test File:** `src/webparts/companyCelebrations/components/__tests__/CompanyCelebrations.test.tsx`

```typescript
import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import CompanyCelebrations from '../CompanyCelebrations';
import { ICelebrationService } from '../../services/ICelebrationService';
import { ICelebrationEvent } from '../../models/ICelebrationEvent';

// Mock service
const mockService: ICelebrationService = {
  getEvents: jest.fn().mockResolvedValue([]),
  getEventsByType: jest.fn().mockResolvedValue([]),
  addEvent: jest.fn().mockResolvedValue({} as ICelebrationEvent),
  updateEvent: jest.fn().mockResolvedValue(undefined),
  deleteEvent: jest.fn().mockResolvedValue(undefined),
  ensureList: jest.fn().mockResolvedValue(true),
};

describe('CompanyCelebrations', () => {
  it('renders without crashing', async () => {
    const props: any = {
      celebrationService: mockService,
      title: 'Test Title',
      showUpcomingCount: 10,
      enableFiltering: true,
      enableAddEvent: true,
      enableEditEvent: true,
      enableDeleteEvent: true,
    };

    render(<CompanyCelebrations {...props} />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });
  });
});
```

---

## Deployment

### Step 1: Build and Package

```powershell
# Set NODE_ENV
$env:NODE_ENV="production"

# Bundle the solution
gulp bundle --ship

# Package the solution
gulp package-solution --ship

# Output will be in: sharepoint/solution/company-celebrations-spfx.sppkg
```

### Step 2: Upload to App Catalog

1. Navigate to SharePoint Admin Center
2. Go to "More features" → "Apps" → "Open"
3. Click "App Catalog"
4. Upload `company-celebrations-spfx.sppkg`
5. Check "Make this solution available to all sites"
6. Click "Deploy"

### Step 3: Add to Site

1. Navigate to your SharePoint site
2. Go to "Site contents" → "New" → "App"
3. Find "Company Celebrations"
4. Click "Add"
5. Wait for installation to complete

### Step 4: Add Web Part to Page

1. Edit a SharePoint page
2. Click "+" to add a web part
3. Search for "Company Celebrations"
4. Add the web part
5. Configure properties in the property pane
6. Save and publish the page

---

## Troubleshooting

### Common Issues

#### 1. List Not Found Error

**Problem:** "List 'CompanyCelebrations' does not exist"

**Solution:**
```powershell
# Verify list exists
Connect-PnPOnline -Url "https://yourtenant.sharepoint.com/sites/yoursite" -Interactive
Get-PnPList -Identity "CompanyCelebrations"

# If not found, create it using the methods in section 2
```

#### 2. Permission Denied

**Problem:** "Access denied" when trying to read/write list items

**Solution:**
- Check user has at least "Contribute" permissions on the list
- Verify web part manifest has correct permission scopes
- Check site collection features are activated

#### 3. PnPjs Not Working

**Problem:** "Cannot read property 'web' of undefined"

**Solution:**
```typescript
// Ensure proper initialization in web part
import { spfi, SPFx } from "@pnp/sp";

public render(): void {
  const sp = spfi().using(SPFx(this.context));
  // Pass sp to your service
}
```

#### 4. Styling Issues

**Problem:** Styles not applying or conflicting with SharePoint

**Solution:**
- Use CSS Modules with unique class names
- Avoid global styles
- Use `!important` sparingly
- Test in both light and dark themes

#### 5. Date Format Issues

**Problem:** Dates showing incorrectly or timezone issues

**Solution:**
```typescript
// Always use ISO date strings
const eventDate = new Date(event.EventDate).toISOString();

// For display, use user's locale
const displayDate = new Date(event.EventDate).toLocaleDateString();
```

### Debug Mode

Enable debugging in local workbench:

```typescript
// In your web part file
protected get isRenderAsync(): boolean {
  return true;
}

protected onInit(): Promise<void> {
  console.log('Initializing web part...');
  return super.onInit();
}
```

### Useful Commands

```powershell
# Clean solution
gulp clean

# Rebuild
gulp build

# Test in local workbench
gulp serve

# Test in SharePoint workbench
gulp serve --nobrowser
# Then navigate to: https://yourtenant.sharepoint.com/_layouts/workbench.aspx

# Trust development certificate
gulp trust-dev-cert

# View bundle analysis
gulp bundle --ship --analyze
```

---

## Next Steps

1. ✅ Complete project setup
2. ✅ Create SharePoint list
3. ✅ Implement service layer
4. ⬜ Migrate all components
5. ⬜ Implement styling
6. ⬜ Write unit tests
7. ⬜ Deploy to test environment
8. ⬜ User acceptance testing
9. ⬜ Production deployment
10. ⬜ Create user documentation

---

## Additional Resources

- [SPFx Documentation](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/sharepoint-framework-overview)
- [PnPjs Documentation](https://pnp.github.io/pnpjs/)
- [Fluent UI React v9](https://react.fluentui.dev/)
- [SPFx React Samples](https://github.com/pnp/sp-dev-fx-webparts/tree/main/samples)
- [SharePoint REST API Reference](https://learn.microsoft.com/en-us/sharepoint/dev/sp-add-ins/get-to-know-the-sharepoint-rest-service)
