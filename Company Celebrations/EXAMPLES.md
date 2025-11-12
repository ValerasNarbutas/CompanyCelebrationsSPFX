# Company Celebrations - Code Examples

This document contains practical code examples for working with the Company Celebrations SPFx web part.

## Table of Contents

1. [SharePoint List Setup](#sharepoint-list-setup)
2. [Service Layer Usage](#service-layer-usage)
3. [Custom Components](#custom-components)
4. [Data Import/Export](#data-importexport)
5. [Integration Examples](#integration-examples)
6. [Testing Examples](#testing-examples)
7. [Deployment Automation](#deployment-automation)

---

## SharePoint List Setup

### Basic List Creation with PowerShell

```powershell
# Connect to SharePoint
Connect-PnPOnline -Url "https://yourtenant.sharepoint.com/sites/yoursite" -Interactive

# Create list
New-PnPList -Title "CompanyCelebrations" -Template GenericList -OnQuickLaunch

# Add EventDate column (Date only)
Add-PnPField -List "CompanyCelebrations" `
  -DisplayName "EventDate" `
  -InternalName "EventDate" `
  -Type DateTime `
  -AddToDefaultView `
  -Required

# Add EventType column (Choice)
$choiceFieldXml = @"
<Field Type='Choice' 
       DisplayName='EventType' 
       Required='TRUE' 
       Format='Dropdown' 
       StaticName='EventType' 
       Name='EventType'>
  <CHOICES>
    <CHOICE>Birthday</CHOICE>
    <CHOICE>Special Day</CHOICE>
  </CHOICES>
  <Default>Birthday</Default>
</Field>
"@
Add-PnPFieldFromXml -List "CompanyCelebrations" -FieldXml $choiceFieldXml -AddToDefaultView

# Add Notes column (Multi-line text)
Add-PnPField -List "CompanyCelebrations" `
  -DisplayName "Notes" `
  -InternalName "Notes" `
  -Type Note `
  -AddToDefaultView `
  -Required:$false

Write-Host "List created successfully!" -ForegroundColor Green
```

### Add Sample Data

```powershell
$today = Get-Date
$sampleEvents = @(
    @{
        Title = "Company Anniversary"
        EventDate = Get-Date -Year $today.Year -Month 9 -Day 1
        EventType = "Special Day"
        Notes = "Founded in 2010"
    },
    @{
        Title = "Holiday Party"
        EventDate = Get-Date -Year $today.Year -Month 12 -Day 20
        EventType = "Special Day"
        Notes = "Annual company party"
    }
)

foreach ($event in $sampleEvents) {
    Add-PnPListItem -List "CompanyCelebrations" -Values $event
    Write-Host "✓ Added: $($event.Title)" -ForegroundColor Green
}
```

---

## Service Layer Usage

### Initialize the Service

```typescript
import { SPFI, spfi, SPFx } from "@pnp/sp";
import { CelebrationService } from './services/CelebrationService';

// In your web part's onInit() method
protected async onInit(): Promise<void> {
  // Initialize PnPjs
  const sp: SPFI = spfi().using(SPFx(this.context));
  
  // Create service instance
  const service = new CelebrationService(
    sp,
    "CompanyCelebrations",
    this.context.pageContext.web.absoluteUrl
  );
  
  return super.onInit();
}
```

### CRUD Operations

```typescript
// Get all events
const events = await service.getEvents();
console.log(`Found ${events.length} events`);

// Add a new event
const newEvent = await service.addEvent({
  Title: "John Doe",
  EventDate: "1985-03-15T00:00:00Z",
  EventType: "Birthday",
  Notes: "Engineering Team"
});
console.log(`Added event with ID: ${newEvent.Id}`);

// Update an event
await service.updateEvent(newEvent.Id, {
  Notes: "Updated: Senior Engineer"
});
console.log('Event updated');

// Delete an event
await service.deleteEvent(newEvent.Id);
console.log('Event deleted');

// Filter by type
const birthdays = await service.getEventsByType("Birthday");
console.log(`Found ${birthdays.length} birthdays`);
```

### Error Handling

```typescript
async function fetchEventsWithErrorHandling(): Promise<ICelebrationEvent[]> {
  try {
    return await service.getEvents();
  } catch (error) {
    if (error.message.includes('does not exist')) {
      console.error('List not found. Please create the CompanyCelebrations list.');
      // Optionally, try to create the list
      await service.createList();
      return await service.getEvents();
    } else if (error.message.includes('Access denied')) {
      console.error('Insufficient permissions to access the list.');
      return [];
    } else {
      console.error('Unexpected error:', error);
      throw error;
    }
  }
}
```

---

## Custom Components

### Simple Event List Component

```typescript
import * as React from 'react';
import { ICelebrationService } from '../services/ICelebrationService';
import { useCelebrations } from '../hooks/useCelebrations';

interface IEventListProps {
  service: ICelebrationService;
  eventType?: 'Birthday' | 'Special Day';
}

export const EventList: React.FC<IEventListProps> = ({ service, eventType }) => {
  const { events, loading, error } = useCelebrations(service);
  
  const filteredEvents = React.useMemo(() => {
    if (!eventType) return events;
    return events.filter(e => e.EventType === eventType);
  }, [events, eventType]);

  if (loading) return <div>Loading events...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {filteredEvents.map(event => (
        <li key={event.Id}>
          <strong>{event.Title}</strong> - {new Date(event.EventDate).toLocaleDateString()}
          {event.Notes && <p>{event.Notes}</p>}
        </li>
      ))}
    </ul>
  );
};
```

### Birthday Countdown Widget

```typescript
import * as React from 'react';
import { ICelebrationEvent } from '../models/ICelebrationEvent';
import { getUpcomingEvents } from '../utils/calendar-utils';

interface IBirthdayCountdownProps {
  events: ICelebrationEvent[];
}

export const BirthdayCountdown: React.FC<IBirthdayCountdownProps> = ({ events }) => {
  const upcomingBirthdays = React.useMemo(() => {
    const birthdays = events.filter(e => e.EventType === 'Birthday');
    return getUpcomingEvents(birthdays, 3);
  }, [events]);

  const nextBirthday = upcomingBirthdays[0];

  if (!nextBirthday) {
    return <div>No upcoming birthdays</div>;
  }

  return (
    <div className="birthday-countdown">
      <h3>🎂 Next Birthday</h3>
      <div className="countdown-card">
        <h2>{nextBirthday.Title}</h2>
        <p className="days-until">
          {nextBirthday.daysUntil === 0 ? 'TODAY!' : 
           nextBirthday.daysUntil === 1 ? 'Tomorrow' :
           `in ${nextBirthday.daysUntil} days`}
        </p>
        <p className="event-date">
          {new Date(nextBirthday.EventDate).toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>
    </div>
  );
};
```

---

## Data Import/Export

### Import from CSV (PowerShell)

```powershell
# CSV format: Name,Date,Type,Notes
# Example: John Doe,1985-03-15,Birthday,Engineering Team

Connect-PnPOnline -Url "https://yourtenant.sharepoint.com/sites/yoursite" -Interactive

$csvPath = "C:\celebrations.csv"
$events = Import-Csv -Path $csvPath

Write-Host "Importing $($events.Count) events..." -ForegroundColor Cyan

$successCount = 0
$errorCount = 0

foreach ($event in $events) {
    try {
        $eventDate = [DateTime]::Parse($event.Date)
        
        Add-PnPListItem -List "CompanyCelebrations" -Values @{
            Title = $event.Name
            EventDate = $eventDate.ToString("yyyy-MM-ddT00:00:00Z")
            EventType = $event.Type
            Notes = $event.Notes
        } | Out-Null
        
        Write-Host "✓ $($event.Name)" -ForegroundColor Green
        $successCount++
    }
    catch {
        Write-Host "✗ $($event.Name): $_" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host "`n$successCount imported, $errorCount failed" -ForegroundColor Cyan
```

### Export to CSV (PowerShell)

```powershell
Connect-PnPOnline -Url "https://yourtenant.sharepoint.com/sites/yoursite" -Interactive

$items = Get-PnPListItem -List "CompanyCelebrations" -Fields "Title","EventDate","EventType","Notes"

$exportData = $items | ForEach-Object {
    [PSCustomObject]@{
        Name = $_.FieldValues.Title
        Date = ([DateTime]$_.FieldValues.EventDate).ToString("yyyy-MM-dd")
        Type = $_.FieldValues.EventType
        Notes = $_.FieldValues.Notes
    }
}

$exportPath = "C:\celebrations-export-$(Get-Date -Format 'yyyyMMdd').csv"
$exportData | Export-Csv -Path $exportPath -NoTypeInformation

Write-Host "Exported $($exportData.Count) events to $exportPath" -ForegroundColor Green
```

### Export via TypeScript

```typescript
import { ICelebrationEvent } from '../models/ICelebrationEvent';

export function exportToCSV(events: ICelebrationEvent[]): void {
  // Create CSV content
  const headers = ['Name', 'Date', 'Type', 'Notes'];
  const rows = events.map(event => [
    event.Title,
    new Date(event.EventDate).toISOString().split('T')[0],
    event.EventType,
    event.Notes || ''
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  // Download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `celebrations-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

---

## Integration Examples

### Microsoft Teams Notification

```typescript
import { MSGraphClientV3 } from '@microsoft/sp-http';

async function sendBirthdayNotification(
  graphClient: MSGraphClientV3,
  birthday: ICelebrationEvent
): Promise<void> {
  const message = {
    subject: `🎂 Birthday Today: ${birthday.Title}`,
    importance: 'normal',
    body: {
      contentType: 'html',
      content: `
        <h2>🎉 Birthday Celebration!</h2>
        <p>Today is <strong>${birthday.Title}'s</strong> birthday!</p>
        <p>Don't forget to wish them a happy birthday!</p>
        ${birthday.Notes ? `<p><em>${birthday.Notes}</em></p>` : ''}
      `
    },
    toRecipients: [
      {
        emailAddress: {
          address: 'team@company.com'
        }
      }
    ]
  };
  
  try {
    await graphClient.api('/me/sendMail').post({ message });
    console.log('Birthday notification sent');
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}
```

### Power Automate Flow (JSON)

```json
{
  "trigger": {
    "type": "Recurrence",
    "recurrence": {
      "frequency": "Day",
      "interval": 1,
      "schedule": {
        "hours": ["9"],
        "minutes": [0]
      }
    }
  },
  "actions": {
    "Get_today_birthdays": {
      "type": "ApiConnection",
      "inputs": {
        "host": {
          "connectionName": "shared_sharepointonline",
          "apiId": "/providers/Microsoft.PowerApps/apis/shared_sharepointonline"
        },
        "method": "get",
        "path": "/datasets/@{encodeURIComponent('https://yourtenant.sharepoint.com/sites/yoursite')}/tables/@{encodeURIComponent('CompanyCelebrations')}/items",
        "queries": {
          "$filter": "month(EventDate) eq @{month(utcNow())} and day(EventDate) eq @{day(utcNow())}"
        }
      }
    },
    "Send_birthday_email": {
      "type": "ApiConnection",
      "foreach": "@body('Get_today_birthdays')?['value']",
      "actions": {
        "Send_an_email_(V2)": {
          "type": "ApiConnection",
          "inputs": {
            "host": {
              "connectionName": "shared_office365",
              "apiId": "/providers/Microsoft.PowerApps/apis/shared_office365"
            },
            "method": "post",
            "path": "/v2/Mail",
            "body": {
              "To": "team@company.com",
              "Subject": "🎂 Birthday Today: @{items('Send_birthday_email')?['Title']}",
              "Body": "<p>Today is @{items('Send_birthday_email')?['Title']}'s birthday! 🎉</p>",
              "Importance": "Normal"
            }
          }
        }
      }
    }
  }
}
```

---

## Testing Examples

### Unit Test for Calendar Utils

```typescript
import { getUpcomingEvents, getEventsForDate } from '../utils/calendar-utils';
import { ICelebrationEvent } from '../models/ICelebrationEvent';

describe('calendar-utils', () => {
  const mockEvents: ICelebrationEvent[] = [
    {
      Id: 1,
      Title: 'John Doe',
      EventDate: '1985-03-15T00:00:00Z',
      EventType: 'Birthday',
      Notes: 'Team member'
    },
    {
      Id: 2,
      Title: 'Jane Smith',
      EventDate: '1990-12-25T00:00:00Z',
      EventType: 'Birthday',
      Notes: 'Manager'
    }
  ];

  describe('getUpcomingEvents', () => {
    it('should return events sorted by next occurrence', () => {
      const upcoming = getUpcomingEvents(mockEvents, 10);
      
      expect(upcoming).toHaveLength(2);
      expect(upcoming[0].daysUntil).toBeLessThanOrEqual(upcoming[1].daysUntil);
    });

    it('should limit results to specified count', () => {
      const upcoming = getUpcomingEvents(mockEvents, 1);
      
      expect(upcoming).toHaveLength(1);
    });

    it('should calculate correct days until', () => {
      const upcoming = getUpcomingEvents(mockEvents, 10);
      
      upcoming.forEach(event => {
        expect(event.daysUntil).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('getEventsForDate', () => {
    it('should return events matching the date', () => {
      const date = new Date(2024, 2, 15); // March 15, 2024
      const events = getEventsForDate(mockEvents, date);
      
      expect(events).toHaveLength(1);
      expect(events[0].Title).toBe('John Doe');
    });

    it('should match by month and day only', () => {
      const date1 = new Date(2024, 2, 15);
      const date2 = new Date(2025, 2, 15);
      
      const events1 = getEventsForDate(mockEvents, date1);
      const events2 = getEventsForDate(mockEvents, date2);
      
      expect(events1).toEqual(events2);
    });
  });
});
```

### Integration Test

```typescript
import { CelebrationService } from '../services/CelebrationService';
import { SPFI } from '@pnp/sp';

describe('CelebrationService Integration', () => {
  let service: CelebrationService;
  let testEventId: number;

  beforeAll(async () => {
    // Setup: Create test service instance
    // Note: This requires actual SharePoint connection
    const sp: SPFI = /* initialize with test context */;
    service = new CelebrationService(sp, 'CompanyCelebrationsTest');
    
    // Ensure test list exists
    await service.createList();
  });

  afterAll(async () => {
    // Cleanup: Delete test event
    if (testEventId) {
      await service.deleteEvent(testEventId);
    }
  });

  it('should add a new event', async () => {
    const newEvent = {
      Title: 'Test User',
      EventDate: '2000-01-01T00:00:00Z',
      EventType: 'Birthday' as const,
      Notes: 'Test event'
    };

    const result = await service.addEvent(newEvent);
    testEventId = result.Id;

    expect(result.Id).toBeGreaterThan(0);
    expect(result.Title).toBe('Test User');
  });

  it('should retrieve events', async () => {
    const events = await service.getEvents();
    
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThan(0);
  });

  it('should update an event', async () => {
    await service.updateEvent(testEventId, {
      Notes: 'Updated test event'
    });

    const events = await service.getEvents();
    const updatedEvent = events.find(e => e.Id === testEventId);

    expect(updatedEvent?.Notes).toBe('Updated test event');
  });
});
```

---

## Deployment Automation

### GitHub Actions Workflow

```yaml
name: Deploy SPFx to SharePoint

on:
  push:
    branches: [ main ]
  workflow_dispatch:

env:
  NODE_VERSION: '18.x'
  SOLUTION_PATH: './Company Celebrations'

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
        cache-dependency-path: '${{ env.SOLUTION_PATH }}/package-lock.json'
    
    - name: Install dependencies
      run: |
        cd "${{ env.SOLUTION_PATH }}"
        npm ci
    
    - name: Build solution
      run: |
        cd "${{ env.SOLUTION_PATH }}"
        gulp bundle --ship
        gulp package-solution --ship
    
    - name: Upload package
      uses: actions/upload-artifact@v3
      with:
        name: spfx-package
        path: '${{ env.SOLUTION_PATH }}/sharepoint/solution/*.sppkg'
        retention-days: 30

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Download package
      uses: actions/download-artifact@v3
      with:
        name: spfx-package
    
    - name: Install CLI for Microsoft 365
      run: npm install -g @pnp/cli-microsoft365
    
    - name: Login to Microsoft 365
      env:
        SHAREPOINT_USERNAME: ${{ secrets.SHAREPOINT_USERNAME }}
        SHAREPOINT_PASSWORD: ${{ secrets.SHAREPOINT_PASSWORD }}
      run: |
        m365 login --authType password \
          --userName "$SHAREPOINT_USERNAME" \
          --password "$SHAREPOINT_PASSWORD"
    
    - name: Deploy to App Catalog
      env:
        SHAREPOINT_APP_CATALOG: ${{ secrets.SHAREPOINT_APP_CATALOG }}
      run: |
        m365 spo app add \
          --filePath "company-celebrations.sppkg" \
          --appCatalogUrl "$SHAREPOINT_APP_CATALOG" \
          --overwrite
        
        m365 spo app deploy \
          --name "company-celebrations.sppkg" \
          --appCatalogUrl "$SHAREPOINT_APP_CATALOG" \
          --skipFeatureDeployment
```

### Azure DevOps Pipeline

```yaml
trigger:
  branches:
    include:
    - main

pool:
  vmImage: 'ubuntu-latest'

variables:
  nodeVersion: '18.x'
  solutionPath: 'Company Celebrations'

stages:
- stage: Build
  displayName: 'Build SPFx Solution'
  jobs:
  - job: BuildJob
    displayName: 'Build'
    steps:
    - task: NodeTool@0
      displayName: 'Use Node $(nodeVersion)'
      inputs:
        versionSpec: $(nodeVersion)
    
    - script: |
        cd "$(solutionPath)"
        npm ci
      displayName: 'Install dependencies'
    
    - script: |
        cd "$(solutionPath)"
        gulp bundle --ship
        gulp package-solution --ship
      displayName: 'Build solution'
    
    - task: PublishBuildArtifacts@1
      displayName: 'Publish artifacts'
      inputs:
        PathtoPublish: '$(solutionPath)/sharepoint/solution'
        ArtifactName: 'drop'

- stage: Deploy
  displayName: 'Deploy to SharePoint'
  dependsOn: Build
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
  jobs:
  - deployment: DeployJob
    displayName: 'Deploy'
    environment: 'Production'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: NodeTool@0
            displayName: 'Use Node $(nodeVersion)'
            inputs:
              versionSpec: $(nodeVersion)
          
          - script: npm install -g @pnp/cli-microsoft365
            displayName: 'Install CLI for Microsoft 365'
          
          - script: |
              m365 login --authType password \
                --userName "$(SharePointUsername)" \
                --password "$(SharePointPassword)"
              
              m365 spo app add \
                --filePath "$(Pipeline.Workspace)/drop/company-celebrations.sppkg" \
                --appCatalogUrl "$(SharePointAppCatalog)" \
                --overwrite
              
              m365 spo app deploy \
                --name "company-celebrations.sppkg" \
                --appCatalogUrl "$(SharePointAppCatalog)" \
                --skipFeatureDeployment
            displayName: 'Deploy to App Catalog'
```

---

## Additional Resources

- [SharePoint Framework Documentation](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/sharepoint-framework-overview)
- [PnPjs Documentation](https://pnp.github.io/pnpjs/)
- [PnP PowerShell Documentation](https://pnp.github.io/powershell/)
- [CLI for Microsoft 365](https://pnp.github.io/cli-microsoft365/)

---

**Note**: Replace placeholder values (URLs, credentials, etc.) with your actual values when using these examples.
