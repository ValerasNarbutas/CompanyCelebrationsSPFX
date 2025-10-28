# Company Celebrations - SPFx Project Requirements

## Executive Summary

This document outlines the requirements for converting the Company Celebrations calendar application from a standalone React application to a SharePoint Framework (SPFx) web part. The application tracks employee birthdays and company special days, providing a centralized celebration calendar for teams.

## Current Application Overview

### Technology Stack (Current)
- **Frontend Framework**: React 19.0.0
- **Build Tool**: Vite 6.3.5
- **UI Library**: Radix UI components with custom styling
- **State Management**: GitHub Spark hooks (`useKV` for key-value storage)
- **Styling**: Tailwind CSS 4.1.11
- **Date Handling**: date-fns 3.6.0
- **Icons**: Phosphor Icons
- **Notifications**: Sonner (toast notifications)
- **Animations**: Framer Motion 12.6.2

### Core Features
1. **Event Management**
   - Add new celebration events (birthdays and special days)
   - Edit existing events
   - Delete events with confirmation
   - Event types: Birthday, Special Day

2. **Calendar Views**
   - Monthly calendar grid view with event indicators
   - Upcoming events list with countdown
   - Event filtering by type (All, Birthdays, Special Days)

3. **Data Model**
   ```typescript
   interface CelebrationEvent {
     id: string
     name: string
     date: string (ISO format)
     type: 'birthday' | 'special-day'
     notes?: string
   }
   ```

4. **User Interactions**
   - Click calendar dates to view events
   - Click event cards to edit
   - Navigate between months
   - Filter events by type
   - Toast notifications for actions

## SPFx Project Requirements

### Target SharePoint Environment
- **SPFx Version**: 1.19.0 or higher
- **Node Version**: 18.x LTS
- **SharePoint Version**: SharePoint Online
- **Target Deployment**: Modern SharePoint pages
- **Web Part Type**: Full-page or section web part

### Technology Stack (SPFx)

#### Required Changes
1. **Framework Compatibility**
   - React version must be compatible with SPFx (typically React 17.x or 18.x)
   - Remove GitHub Spark dependencies
   - Replace Vite with SPFx build toolchain (Webpack)

2. **Storage Solution**
   - Replace `useKV` hook with SharePoint List storage
   - Implement SPFx context for data operations
   - Use PnPjs or SharePoint REST API

3. **UI Components**
   - Keep Radix UI components (compatible with SPFx)
   - Adapt Tailwind CSS for SPFx or use Fluent UI
   - Maintain shadcn/ui component structure where possible

4. **Styling Approach**
   - **Option A**: Continue with Tailwind CSS (requires build configuration)
   - **Option B**: Migrate to Fluent UI 9 for native SharePoint look
   - **Option C**: Hybrid approach with CSS modules

### SharePoint List Schema

#### List Name: `CompanyCelebrations`

**Columns:**
| Column Name | Type | Required | Description |
|-------------|------|----------|-------------|
| Title | Single line of text | Yes | Event name (e.g., "John Doe" or "Company Anniversary") |
| EventDate | Date | Yes | Date of celebration |
| EventType | Choice | Yes | Choices: "Birthday", "Special Day" |
| Notes | Multiple lines of text | No | Optional notes about the event |
| Created | Date (system) | Auto | Creation timestamp |
| Modified | Date (system) | Auto | Last modified timestamp |

**List Settings:**
- Enable versioning: Yes
- Require content approval: No
- Allow management of content types: No
- Create default view showing all columns

### Web Part Properties

```typescript
export interface ICompanyCelebrationsWebPartProps {
  title: string; // Web part title
  listName: string; // Name of SharePoint list (default: "CompanyCelebrations")
  defaultView: 'calendar' | 'list'; // Default view on load
  showUpcomingCount: number; // Number of upcoming events to show (default: 10)
  enableFiltering: boolean; // Show/hide filter controls
  enableAddEvent: boolean; // Allow users to add events
  enableEditEvent: boolean; // Allow users to edit events
  enableDeleteEvent: boolean; // Allow users to delete events
  colorSchemeBirthday: string; // Color for birthday events
  colorSchemeSpecialDay: string; // Color for special day events
}
```

### Permissions & Security

#### Required Permissions
- **List Permissions**: Read, Write (for list operations)
- **Web Permissions**: Read (for context)

#### Permission Scopes in manifest
```json
"requiredResources": [
  {
    "resource": "lists",
    "scope": "write"
  }
]
```

#### User Capabilities
- **All Users**: View events, filter events
- **Contribute+**: Add, edit, delete events (configurable via web part properties)
- **Site Owners**: Full control including list management

### Component Architecture (SPFx)

```
src/
├── webparts/
│   └── companyCelebrations/
│       ├── CompanyCelebrationsWebPart.ts (Main web part class)
│       ├── CompanyCelebrationsWebPart.manifest.json
│       ├── components/
│       │   ├── CompanyCelebrations.tsx (Main component)
│       │   ├── CompanyCelebrations.module.scss
│       │   ├── ICompanyCelebrationsProps.ts
│       │   ├── AddEventDialog.tsx
│       │   ├── EditEventDialog.tsx
│       │   ├── CalendarView.tsx
│       │   ├── UpcomingEvents.tsx
│       │   ├── EventCard.tsx
│       │   ├── EventFilter.tsx
│       │   ├── EmptyState.tsx
│       │   └── ui/ (Radix UI components)
│       ├── services/
│       │   ├── CelebrationService.ts (SharePoint operations)
│       │   └── ICelebrationService.ts
│       ├── models/
│       │   └── ICelebrationEvent.ts
│       └── utils/
│           ├── calendar-utils.ts
│           └── dateHelpers.ts
└── assets/ (images, icons)
```

### Data Service Layer

```typescript
// services/ICelebrationService.ts
export interface ICelebrationService {
  getEvents(): Promise<ICelebrationEvent[]>;
  addEvent(event: Omit<ICelebrationEvent, 'id'>): Promise<ICelebrationEvent>;
  updateEvent(id: string, event: Partial<ICelebrationEvent>): Promise<void>;
  deleteEvent(id: string): Promise<void>;
  getEventsByType(type: EventType): Promise<ICelebrationEvent[]>;
}

// services/CelebrationService.ts
import { SPFI } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";

export class CelebrationService implements ICelebrationService {
  private sp: SPFI;
  private listName: string;

  constructor(sp: SPFI, listName: string) {
    this.sp = sp;
    this.listName = listName;
  }

  public async getEvents(): Promise<ICelebrationEvent[]> {
    // Implementation with PnPjs
  }

  // ... other methods
}
```

### Migration Considerations

#### State Management
- **Current**: GitHub Spark `useKV` hook (local storage-like)
- **SPFx**: React hooks + SharePoint list operations
- **Approach**: 
  - Create custom `useCelebrations` hook wrapping the service layer
  - Implement optimistic updates with local state
  - Handle loading and error states

#### Styling Migration
1. **Tailwind CSS Path** (Recommended)
   - Configure SPFx build to support Tailwind
   - Use PostCSS in SPFx webpack config
   - Maintain existing class names

2. **Fluent UI Path** (Alternative)
   - Replace Radix UI with Fluent UI React components
   - Adopt Fluent UI design tokens
   - Better SharePoint integration

#### Dependencies to Replace/Remove
- ❌ `@github/spark` → Custom hooks + SPFx context
- ❌ Vite → SPFx build toolchain
- ⚠️ `framer-motion` → Consider lighter alternative or CSS animations
- ✅ `date-fns` → Keep
- ✅ `@radix-ui/*` → Keep (unless migrating to Fluent UI)
- ⚠️ `sonner` → Replace with Fluent UI MessageBar or keep

### Development Workflow

#### Initial Setup
```bash
# Install SPFx globally
npm install -g @microsoft/generator-sharepoint

# Create new SPFx project
yo @microsoft/sharepoint

# Project Configuration:
# - Solution name: company-celebrations-spfx
# - Target: SharePoint Online
# - Folder: Current folder
# - Type: WebPart
# - Name: CompanyCelebrations
# - Description: Employee celebration calendar
# - Framework: React
# - Hosting: SharePoint Online
```

#### Local Development
```bash
# Install dependencies
npm install

# Start local workbench
gulp serve

# Test in SharePoint Online workbench
gulp serve --nobrowser
# Navigate to: https://yourtenant.sharepoint.com/_layouts/15/workbench.aspx
```

#### Deployment
```bash
# Bundle for production
gulp bundle --ship

# Package solution
gulp package-solution --ship

# Output: sharepoint/solution/company-celebrations-spfx.sppkg
# Upload to SharePoint App Catalog
```

### SharePoint Deployment Steps

1. **Create SharePoint List**
   - Navigate to site contents
   - Create "CompanyCelebrations" list
   - Add custom columns as per schema
   - Set appropriate permissions

2. **Deploy App Package**
   - Upload .sppkg to App Catalog
   - Check "Make available to all sites"
   - Deploy globally or to specific sites

3. **Add Web Part to Page**
   - Edit SharePoint page
   - Add "Company Celebrations" web part
   - Configure web part properties
   - Publish page

### Testing Requirements

#### Unit Tests
- Test calendar utility functions
- Test date calculations and formatting
- Test event filtering logic
- Test form validation

#### Integration Tests
- Test SharePoint list operations
- Test CRUD operations
- Test error handling
- Test permission scenarios

#### Browser Testing
- Microsoft Edge (Chromium)
- Google Chrome
- Firefox
- Safari

#### Responsive Testing
- Desktop (1920x1080, 1366x768)
- Tablet (768x1024)
- Mobile (375x667, 414x896)

### Performance Considerations

1. **Caching Strategy**
   - Cache list items for 5 minutes
   - Invalidate cache on CRUD operations
   - Use session storage for filter state

2. **Lazy Loading**
   - Load UI components on demand
   - Implement virtual scrolling for large event lists
   - Paginate calendar if many events

3. **Bundle Size**
   - Keep bundle under 300KB (gzipped)
   - Code-split large dependencies
   - Use tree-shaking

4. **API Optimization**
   - Batch requests where possible
   - Use OData filtering and selection
   - Implement request throttling

### Accessibility Requirements

- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Focus management in dialogs
- Color contrast ratios (4.5:1 for text)
- ARIA labels and roles

### Localization Support

- English (default)
- Support for additional languages via SPFx localization
- Date formatting based on user locale
- Resource files for UI strings

### Error Handling

1. **Network Errors**
   - Display user-friendly error messages
   - Provide retry mechanism
   - Log errors to console

2. **Permission Errors**
   - Check permissions before operations
   - Display appropriate message if insufficient permissions
   - Gracefully degrade features

3. **Validation Errors**
   - Client-side form validation
   - Server-side validation
   - Clear error messages

### Documentation Requirements

1. **User Documentation**
   - How to add/edit/delete events
   - How to use filters
   - How to navigate calendar
   - FAQ section

2. **Admin Documentation**
   - Installation guide
   - Configuration options
   - Troubleshooting guide
   - Permissions setup

3. **Developer Documentation**
   - Architecture overview
   - Component documentation
   - API reference
   - Contribution guidelines

## Success Criteria

### Functional Requirements ✓
- [ ] All events display correctly in calendar view
- [ ] Users can add new events
- [ ] Users can edit existing events
- [ ] Users can delete events with confirmation
- [ ] Filter by event type works
- [ ] Upcoming events list shows correct countdown
- [ ] Calendar navigation works smoothly
- [ ] Events persist in SharePoint list

### Non-Functional Requirements ✓
- [ ] Web part loads in under 3 seconds
- [ ] No console errors in browser
- [ ] Responsive on all screen sizes
- [ ] Accessible to screen readers
- [ ] Works in all major browsers
- [ ] Bundle size under 300KB

### User Experience ✓
- [ ] Intuitive interface
- [ ] Clear call-to-actions
- [ ] Smooth animations
- [ ] Helpful error messages
- [ ] Empty state guidance

## Timeline Estimate

| Phase | Duration | Tasks |
|-------|----------|-------|
| Setup | 1 day | SPFx project setup, dependencies |
| SharePoint Integration | 2-3 days | List schema, service layer, data operations |
| Component Migration | 3-4 days | Port React components, update imports |
| Styling | 2-3 days | Configure Tailwind/Fluent UI, theme integration |
| Testing | 2-3 days | Unit tests, integration tests, browser testing |
| Documentation | 1-2 days | User docs, admin docs, README |
| Deployment & QA | 1-2 days | Package, deploy, final testing |

**Total Estimate**: 12-18 days

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Tailwind CSS compatibility with SPFx | Medium | Use CSS modules alternative or Fluent UI |
| React version conflicts | High | Use SPFx-compatible React version |
| SharePoint throttling | Medium | Implement caching and request batching |
| Performance degradation | Medium | Optimize bundle size, lazy loading |
| Permission issues | Low | Clear documentation, permission checks |

## Appendix

### Useful Resources
- [SPFx Documentation](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/sharepoint-framework-overview)
- [PnPjs Documentation](https://pnp.github.io/pnpjs/)
- [Fluent UI React](https://developer.microsoft.com/en-us/fluentui)
- [SharePoint REST API](https://learn.microsoft.com/en-us/sharepoint/dev/sp-add-ins/get-to-know-the-sharepoint-rest-service)

### Contact & Support
- Technical Lead: [Name]
- Project Manager: [Name]
- SharePoint Admin: [Name]
