# Company Celebrations - SharePoint Framework Web Part

[![SPFx](https://img.shields.io/badge/SPFx-1.20.0-green.svg)](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/sharepoint-framework-overview)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-17.0.1-blue.svg)](https://reactjs.org/)

A modern SharePoint Framework (SPFx) web part for tracking and celebrating company events including employee birthdays and special days. Never miss an important celebration again with this intuitive calendar-based solution.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [SharePoint List Configuration](#sharepoint-list-configuration)
- [Deployment](#deployment)
- [Configuration](#configuration)
- [Usage](#usage)
- [Architecture](#architecture)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Version History](#version-history)
- [License](#license)

## 🎯 Overview

The Company Celebrations web part provides an elegant solution for organizations to track and celebrate important dates such as employee birthdays and company milestones. Built with SharePoint Framework, it seamlessly integrates with SharePoint Online and Microsoft Teams, offering a responsive, modern user experience.

### Key Highlights

- **Calendar View**: Interactive monthly calendar showing all celebrations
- **Upcoming Events**: Countdown list displaying next celebrations
- **Event Management**: Full CRUD operations (Create, Read, Update, Delete)
- **Event Filtering**: Filter by Birthday or Special Day
- **SharePoint Integration**: Data stored in SharePoint lists
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Teams Compatible**: Can be deployed to Microsoft Teams

## ✨ Features

### Core Functionality

- **📅 Calendar Management**
  - Monthly calendar grid view with event indicators
  - Navigate between months seamlessly
  - Click dates to view events for that day
  - Visual highlighting for dates with celebrations

- **🎂 Event Tracking**
  - Track employee birthdays
  - Track special company days (anniversaries, holidays, etc.)
  - Add custom notes to each event
  - Automatic countdown to upcoming events

- **✏️ Event Management**
  - Add new celebration events via intuitive dialog
  - Edit existing events
  - Delete events with confirmation
  - Form validation to ensure data quality

- **🔍 Filtering & Search**
  - Filter events by type (All, Birthdays, Special Days)
  - View upcoming events in chronological order
  - Configurable number of upcoming events to display

- **⚙️ Configurable Settings**
  - Customizable SharePoint list name
  - Toggle add/edit/delete permissions
  - Configure number of upcoming events shown
  - Enable/disable filtering options

### Technical Features

- **Modern React Implementation**: Built with React 17 and TypeScript
- **PnPjs Integration**: Efficient SharePoint data operations
- **Service Layer Architecture**: Clean separation of concerns
- **Custom Hooks**: Reusable logic with `useCelebrations` hook
- **Date Utilities**: Powered by date-fns for robust date handling
- **Responsive UI**: Fluent UI components for consistency
- **Error Handling**: Comprehensive error management and user feedback

## 📦 Prerequisites

Before you begin, ensure you have the following:

### Required Software

- **Node.js**: Version 18.17.1 or higher (18.x LTS recommended)
- **npm**: Version 8.x or higher (comes with Node.js)
- **SharePoint Online**: Tenant with site collection admin rights
- **Modern Browser**: Microsoft Edge, Chrome, Firefox, or Safari

### SharePoint Requirements

- SharePoint Online environment
- Permissions to create SharePoint lists
- App Catalog access (for deployment)
- Site collection administrator or site owner permissions

### Development Tools (Optional but Recommended)

- Visual Studio Code or similar IDE
- Git for version control
- SharePoint Framework Yeoman generator (for creating new projects)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/ValerasNarbutas/CompanyCelebrationsSPFX.git
cd CompanyCelebrationsSPFX/Company\ Celebrations
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- SharePoint Framework libraries
- React and React DOM
- PnPjs for SharePoint operations
- date-fns for date manipulation
- Fluent UI components
- Development dependencies

### 3. Trust Development Certificate

For local testing with HTTPS:

```bash
gulp trust-dev-cert
```

### 4. Run Local Development Server

```bash
gulp serve
```

This will open the SharePoint Workbench in your default browser.

## 📊 SharePoint List Configuration

The web part requires a SharePoint list to store celebration events. You can create it using any of these methods:

### Method 1: Manual Creation (Recommended for First-Time Setup)

1. Navigate to your SharePoint site
2. Go to **Site contents** → **New** → **List**
3. Name it: `CompanyCelebrations`
4. Add the following custom columns:

| Column Name | Type | Settings |
|------------|------|----------|
| **EventDate** | Date and Time | Format: Date Only, Required: Yes |
| **EventType** | Choice | Choices: "Birthday", "Special Day", Default: "Birthday", Required: Yes |
| **Notes** | Multiple lines of text | Required: No |

### Method 2: PowerShell Script

```powershell
# Connect to SharePoint
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

See [SPFX_IMPLEMENTATION_GUIDE.md](SPFX_IMPLEMENTATION_GUIDE.md) for detailed PnP provisioning template XML.

## 🌐 Deployment

### Step 1: Build the Solution

```bash
# Set to production mode
$env:NODE_ENV="production"  # Windows PowerShell
# or
export NODE_ENV=production  # macOS/Linux

# Bundle the solution
gulp bundle --ship

# Package the solution
gulp package-solution --ship
```

The package will be created at: `sharepoint/solution/company-celebrations.sppkg`

### Step 2: Upload to App Catalog

1. Navigate to **SharePoint Admin Center**
2. Go to **More features** → **Apps** → **Open**
3. Click **App Catalog**
4. Upload `company-celebrations.sppkg`
5. Check **"Make this solution available to all sites"**
6. Click **Deploy**

### Step 3: Add to SharePoint Site

1. Navigate to your target SharePoint site
2. Go to **Site contents** → **New** → **App**
3. Find **"Company Celebrations"**
4. Click **Add**
5. Wait for the installation to complete

### Step 4: Add Web Part to Page

1. Edit a SharePoint page
2. Click **+** to add a web part
3. Search for **"Company Celebrations"**
4. Add the web part to the page
5. Configure settings in the property pane (click edit icon)
6. Save and publish the page

## ⚙️ Configuration

### Web Part Properties

Configure the web part through the property pane:

#### General Settings

- **SharePoint List Name**: Name of the list storing events (default: "CompanyCelebrations")

#### Feature Settings

- **Enable Event Filtering**: Show/hide event type filter
- **Allow Adding Events**: Enable the "Add Event" button
- **Allow Editing Events**: Allow users to edit existing events
- **Allow Deleting Events**: Allow users to delete events

### Property Pane Access

1. Edit the page containing the web part
2. Click the **edit** (pencil) icon on the web part
3. Adjust settings in the property pane
4. Click **Apply** or republish the page

## 📖 Usage

### Adding a Celebration

1. Click the **"Add Celebration"** button
2. Fill in the form:
   - **Name**: Person's name or event description
   - **Date**: Select the celebration date
   - **Type**: Choose "Birthday" or "Special Day"
   - **Notes** (optional): Additional information
3. Click **"Add Event"** to save

### Viewing Celebrations

- **Calendar View**: Click on dates to see events
- **Upcoming Events**: View the list on the right side
- Days with events are highlighted in the calendar

### Editing a Celebration

1. Click on an event in the upcoming list or calendar
2. Edit the details in the dialog
3. Click **"Save Changes"**

### Deleting a Celebration

1. Click on an event to open the edit dialog
2. Click the **"Delete"** button
3. Confirm the deletion

### Filtering Events

Use the filter dropdown to show:
- **All**: All celebration events
- **Birthdays**: Only birthday events
- **Special Days**: Only special day events

## 🏗️ Architecture

### Technology Stack

- **Framework**: SharePoint Framework (SPFx) 1.20.0
- **Frontend**: React 17.0.1 with TypeScript
- **State Management**: React Hooks
- **Data Access**: PnPjs 3.25.0
- **Date Library**: date-fns 3.6.0
- **UI Components**: Fluent UI (@fluentui/react 8.x)
- **Icons**: Phosphor Icons
- **Build Tool**: Gulp with Webpack

### Project Structure

```
Company Celebrations/
├── config/                          # SPFx configuration files
│   ├── package-solution.json        # Solution packaging config
│   ├── config.json                  # Web part configuration
│   └── serve.json                   # Local serve configuration
├── src/
│   └── webparts/companyCelebrations/
│       ├── CompanyCelebrationsWebPart.ts   # Main web part class
│       ├── components/
│       │   ├── CompanyCelebrations.tsx     # Main React component
│       │   └── ICompanyCelebrationsProps.ts # Component props interface
│       ├── models/
│       │   └── ICelebrationEvent.ts        # Data models
│       ├── services/
│       │   ├── ICelebrationService.ts      # Service interface
│       │   └── CelebrationService.ts       # SharePoint data service
│       ├── hooks/
│       │   └── useCelebrations.ts          # Custom React hook
│       └── utils/
│           └── calendar-utils.ts           # Calendar utilities
├── package.json                     # npm package definition
├── tsconfig.json                    # TypeScript configuration
├── gulpfile.js                      # Gulp build tasks
├── README.md                        # This file
├── SPFX_IMPLEMENTATION_GUIDE.md     # Detailed implementation guide
└── SPFX_PROJECT_REQUIREMENTS.md     # Project requirements document
```

### Key Components

#### CelebrationService
Handles all SharePoint list operations:
- `getEvents()`: Fetch all events
- `addEvent()`: Create new event
- `updateEvent()`: Modify existing event
- `deleteEvent()`: Remove event
- `getEventsByType()`: Filter by event type

#### useCelebrations Hook
Custom React hook providing:
- State management for events
- Loading and error states
- CRUD operation methods
- Event filtering logic

#### Calendar Utilities
Helper functions for:
- Generating calendar grids
- Calculating upcoming events
- Date formatting and comparison
- Handling recurring annual events

## 🛠️ Development

### Local Development Workflow

1. **Start Development Server**
   ```bash
   gulp serve
   ```

2. **Test in SharePoint Workbench**
   ```bash
   gulp serve --nobrowser
   ```
   Then navigate to: `https://yourtenant.sharepoint.com/_layouts/workbench.aspx`

3. **Watch for Changes**
   The gulp serve command watches for file changes and reloads automatically.

### Building for Production

```bash
# Clean previous builds
gulp clean

# Build with production optimizations
gulp bundle --ship
gulp package-solution --ship
```

### Testing

```bash
# Run tests (if configured)
gulp test
```

### Code Style

The project uses ESLint with SharePoint Framework configuration:

```bash
# Check for linting issues
npm run lint

# Auto-fix linting issues (if available)
npm run lint:fix
```

### Adding New Features

1. Create feature branch: `git checkout -b feature/your-feature`
2. Implement changes following existing patterns
3. Test thoroughly in local workbench and SharePoint
4. Build and test the package: `gulp bundle --ship`
5. Commit changes with descriptive messages
6. Create pull request for review

### Debugging

#### Browser DevTools
- Use React DevTools for component inspection
- Check console for errors and logs
- Use Network tab to inspect API calls

#### VS Code Debugging
Configure launch.json for debugging in VS Code with Chrome or Edge.

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Issue: "List 'CompanyCelebrations' does not exist"

**Solution**: Create the SharePoint list using one of the methods in [SharePoint List Configuration](#sharepoint-list-configuration).

#### Issue: "Access Denied" errors

**Solutions**:
- Ensure you have at least "Contribute" permissions on the site
- Verify the SharePoint list exists and you have access
- Check web part property permissions settings
- Confirm App Catalog deployment was successful

#### Issue: Package fails to deploy

**Solutions**:
- Verify you're using correct Node.js version (18.x)
- Run `npm install` to ensure all dependencies are installed
- Clean and rebuild: `gulp clean && gulp bundle --ship`
- Check App Catalog has enough storage space

#### Issue: Web part not showing in page

**Solutions**:
- Ensure the app is installed on the site (Site contents → See all)
- Clear browser cache and refresh
- Check if the app needs admin approval
- Verify the web part is enabled in tenant settings

#### Issue: Data not loading

**Solutions**:
- Check browser console for errors
- Verify SharePoint list name matches property configuration
- Ensure list has correct column names and types
- Check network tab for failed API requests
- Verify you have read permissions on the list

#### Issue: Dates showing incorrectly

**Solution**: 
- Check browser timezone settings
- Ensure EventDate column is "Date Only" format
- Verify date-fns is correctly installed

### Enable Debug Mode

Add to web part for detailed logging:

```typescript
protected get isRenderAsync(): boolean {
  return true;
}

protected onInit(): Promise<void> {
  console.log('CompanyCelebrations: Initializing...');
  return super.onInit();
}
```

### Useful Commands

```bash
# Clean build artifacts
gulp clean

# Rebuild solution
gulp build

# Analyze bundle size
gulp bundle --ship --analyze

# Trust development certificate (if expired)
gulp trust-dev-cert

# Untrust development certificate
gulp untrust-dev-cert
```

### Getting Help

If you encounter issues not covered here:

1. Check [SPFX_IMPLEMENTATION_GUIDE.md](SPFX_IMPLEMENTATION_GUIDE.md) for detailed implementation guidance
2. Review [SPFX_PROJECT_REQUIREMENTS.md](SPFX_PROJECT_REQUIREMENTS.md) for project specifications
3. Search [SharePoint Framework documentation](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/sharepoint-framework-overview)
4. Visit [SharePoint Stack Exchange](https://sharepoint.stackexchange.com/)
5. Check [PnPjs documentation](https://pnp.github.io/pnpjs/)
6. Open an issue in the repository

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Reporting Issues

- Use GitHub Issues to report bugs
- Provide detailed description and steps to reproduce
- Include screenshots if applicable
- Mention your environment (Node version, browser, etc.)

### Submitting Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes following the existing code style
4. Test thoroughly
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Guidelines

- Follow TypeScript and React best practices
- Maintain consistent code formatting
- Add comments for complex logic
- Update documentation for new features
- Write unit tests where applicable
- Ensure backward compatibility

## 📝 Version History

| Version | Date | Comments |
|---------|------|----------|
| 1.0.0 | 2024 | Initial release with core features |
| - | - | - Calendar view with monthly navigation |
| - | - | - Event management (CRUD operations) |
| - | - | - Upcoming events with countdown |
| - | - | - Event filtering by type |
| - | - | - SharePoint list integration |
| - | - | - Configurable web part properties |

## 📄 License

**THIS CODE IS PROVIDED _AS IS_ WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING ANY IMPLIED WARRANTIES OF FITNESS FOR A PARTICULAR PURPOSE, MERCHANTABILITY, OR NON-INFRINGEMENT.**

## 📚 Additional Resources

### Documentation
- [SPFX_IMPLEMENTATION_GUIDE.md](SPFX_IMPLEMENTATION_GUIDE.md) - Step-by-step implementation guide
- [SPFX_PROJECT_REQUIREMENTS.md](SPFX_PROJECT_REQUIREMENTS.md) - Detailed project requirements

### SharePoint Framework
- [SharePoint Framework Overview](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/sharepoint-framework-overview)
- [Build your first web part](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/web-parts/get-started/build-a-hello-world-web-part)
- [Deploy to production](https://docs.microsoft.com/en-us/sharepoint/dev/spfx/deploy-sharepoint-framework-solution-to-tenant)

### Libraries & Tools
- [PnPjs Documentation](https://pnp.github.io/pnpjs/) - SharePoint REST API wrapper
- [Fluent UI React](https://developer.microsoft.com/en-us/fluentui) - Microsoft's UI framework
- [date-fns](https://date-fns.org/) - Modern date utility library
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

### Community
- [Microsoft 365 Patterns and Practices](https://aka.ms/m365pnp) - Community resources
- [SharePoint Developer Community](https://aka.ms/sppnp-community) - Community calls and resources
- [SPFx Samples](https://github.com/pnp/sp-dev-fx-webparts) - Sample web parts repository

## 👤 Author

For questions, feedback, or support, please open an issue in the GitHub repository.

---

**Made with ❤️ for the SharePoint community**
