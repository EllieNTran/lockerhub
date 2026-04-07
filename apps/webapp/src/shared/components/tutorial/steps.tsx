import type { Step } from 'react-joyride';

export const USER_TUTORIAL_STEPS: Step[] = [
  {
    target: 'body',
    content: 'Welcome to LockerHub! Let\'s take a quick tour to help you get started.',
    placement: 'center',
    skipBeacon: true,
  },
  {
    target: '[data-tour="nav-home"]',
    content: 'This is the homepage where you can see your current bookings and quick actions.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="nav-book"]',
    content: 'Click here to book a new locker. You can select a floor, choose required dates, and view available lockers via floor plan or list view.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="nav-bookings"]',
    content: 'View and manage all your current and past bookings here.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="nav-special-request"]',
    content: 'Need a locker for a longer period? Submit a special request for long-term or permanent locker access.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="nav-return-key"]',
    content: 'When your booking ends, follow these instructions to return your key.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="logout-btn"]',
    content: 'Click here to logout when you\'re done.',
    placement: 'left',
  },
];

export const ADMIN_TUTORIAL_STEPS: Step[] = [
  {
    target: 'body',
    content: 'Welcome to the Admin Portal! Let\'s explore the administrative features.',
    placement: 'center',
    skipBeacon: true,
  },
  {
    target: '[data-tour="admin-nav-home"]',
    content: 'The admin dashboard shows useful information including: key statistics, recent activity, and floor utilisation.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="admin-nav-bookings"]',
    content: 'Manage all user bookings - view details, confirm key handovers and returns.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="admin-nav-lockers"]',
    content: 'Manage locker inventory, mark lockers for maintenance, and create manual bookings.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="admin-nav-special-requests"]',
    content: 'Review and approve/reject special locker requests for long-term or permanent use.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="admin-nav-analytics"]',
    content: 'View detailed analytics and reports on locker usage, popular floors, and department statistics.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="admin-nav-booking-rules"]',
    content: 'Configure floor booking access and booking rules like maximum duration and advance booking window.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="admin-nav-locker-configuration"]',
    content: 'Configure locker layouts for each floor.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="admin-nav-audit"]',
    content: 'Track all system activities and changes through comprehensive audit logs.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="view-mode-toggle"]',
    content: 'As an admin, you can switch between User and Admin views using this toggle.',
    placement: 'left',
  },
];

// Page-specific tours
export const BOOK_LOCKER_STEPS: Step[] = [
  {
    target: '[data-tour="floor-selector"]',
    content: 'Start by selecting which floor you want to book a locker on.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="date-picker"]',
    content: 'Choose your booking start and end dates. The system will show you available lockers for this period.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="availability-stats"]',
    content: 'This shows how many lockers are available on the selected floor for your chosen dates.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="search-results"]',
    content: 'Available lockers appear here. Green lockers are available, click on a green locker to select it.',
    placement: 'top',
  },
  {
    target: '[data-tour="view-toggle"]',
    content: 'Switch between floor plan view and list view to see available lockers.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="join-waitlist-btn"]',
    content: 'If no lockers are available, you can join the waitlist to be notified when one becomes free.',
    placement: 'top',
  },
  {
    target: '[data-tour="waitlist"]',
    content: 'This shows your current waitlist entries, indicating the floors and dates you\'re waiting for a locker to become available.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="book-btn"]',
    content: (
      <div>
        Once you've selected a locker and dates, click here to confirm your booking.
        You'll receive an email confirmation with your booking details.
        <br /><br />
        Also note that you cannot have multiple bookings with overlapping dates.
      </div>
    ),
    placement: 'top',
  },
];

export const MY_BOOKINGS_STEPS: Step[] = [
  {
    target: '[data-tour="bookings-tabs"]',
    content: 'Filter your bookings by status - view all, active, upcoming, or past bookings.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="booking-card"]',
    content: 'Each booking card shows your booking details and the current status.',
    placement: 'top',
  },
  {
    target: '[data-tour="extend-btn"]',
    content: 'Extend your active bookings if you need the locker for longer (subject to availability and limits).',
    placement: 'left',
  },
  {
    target: '[data-tour="cancel-btn"]',
    content: 'Cancel upcoming bookings if your plans change.',
    placement: 'left',
  },
];

export const SPECIAL_REQUEST_STEPS: Step[] = [
  {
    target: '[data-tour="special-requests-tabs"]',
    content: 'Filter your special requests by status - view all, active, approved, pending, rejected, or cancelled requests.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="special-request-card"]',
    content: 'Each card shows the details of your special request and its current status.',
    placement: 'top',
  },
  {
    target: '[data-tour="cancel-btn"]',
    content: 'Cancel pending or approved requests if your plans change.',
    placement: 'left',
  },
  {
    target: '[data-tour="new-special-request-btn"]',
    content: 'Click here to create a new special request.',
    placement: 'left',
  },
];

export const NEW_SPECIAL_REQUEST_STEPS: Step[] = [
  {
    target: '[data-tour="floor-selector"]',
    content: 'Select which floor you would like to request a locker on.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="permanent-checkbox"]',
    content: 'Check this if you need a permanent locker allocation. Leave unchecked for long-term temporary bookings (more than 3 days).',
    placement: 'bottom',
  },
  {
    target: '[data-tour="date-picker"]',
    content: 'For temporary long-term requests, select your date range. For permanent allocations, only the start date is required.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="locker-selector"]',
    content: 'Optionally select a specific locker, we will accomodate your preference if possible. If left blank, any available locker on the floor can be assigned.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="justification"]',
    content: 'Provide a detailed justification for your request. This helps administrators review and approve your request.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="submit-btn"]',
    content: 'Submit your request for admin review. You\'ll be notified via email when it\'s processed.',
    placement: 'bottom',
  },
];

// Admin page tours
export const ADMIN_BOOKINGS_STEPS: Step[] = [
  {
    target: '[data-tour="admin-bookings-stats"]',
    content: 'View key statistics at a glance - active bookings, pending key handovers, and pending key returns.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="admin-bookings-filters"]',
    content: 'Search for specific employees or locker numbers, and filter bookings by floor and booking status.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="admin-bookings-table"]',
    content: 'All bookings are displayed here with employee details, locker information, and booking status.',
    placement: 'top',
  },
  {
    target: '[data-tour="admin-booking-row"]',
    content: 'Click on any booking row to manage it - confirm key handover or key return or cancel booking.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="admin-booking-locker-link"]',
    content: 'Click on the locker number to view and manage the booked locker details.',
    placement: 'left',
  },
  {
    target: '[data-tour="admin-booking-staff-tooltip"]',
    content: (
      <div>
        Hover over the employee name to see more details about the staff member who made the booking.
        <br /><br />
        You can also copy their email address from the tooltip to contact them if needed.
      </div>
    ),
    placement: 'top',
  },
];

export const ADMIN_LOCKERS_STEPS: Step[] = [
  {
    target: '[data-tour="admin-lockers-stats"]',
    content: 'View total lockers, available lockers, and lockers under maintenance at a glance.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="admin-lockers-filters"]',
    content: 'Search for lockers by number or key number, and filter by floor and locker status.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="admin-lockers-table"]',
    content: 'All lockers are displayed here with their current status, location, and key information.',
    placement: 'top',
  },
  {
    target: '[data-tour="admin-locker-row"]',
    content: 'Click on any locker to manage it - mark as maintenance, report lost keys or create manual bookings.',
    placement: 'top',
  },
  {
    target: '[data-tour="admin-lockers-create-btn"]',
    content: 'Click here to create a new locker in the system.',
    placement: 'left',
  },
];

export const ADMIN_SPECIAL_REQUESTS_STEPS: Step[] = [
  {
    target: '[data-tour="admin-special-requests-stats"]',
    content: 'View pending reviews and active special requests at a glance.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="admin-special-requests-filters"]',
    content: 'Search for specific employees, and filter by floor and request status.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="admin-special-request-card"]',
    content: 'Each card shows request details including justification, dates, and employee information.',
    placement: 'top',
  },
  {
    target: '[data-tour="admin-special-request-actions"]',
    content: (
      <div>
        For pending requests, you can approve or reject them here.
        <br /><br />
        Approved requests will create a booking automatically, and the user will be notified via email.
      </div>
    ),
    placement: 'left',
  },
];

export const ADMIN_ANALYTICS_STEPS: Step[] = [
  {
    target: '[data-tour="admin-analytics-period-filter"]',
    content: 'Select the time period to view analytics data - from last 7 days up to all time.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="admin-analytics-usage-chart"]',
    content: 'This area chart shows locker occupancy trends over time. Filter by floor and department using the filters above the chart.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="admin-analytics-top-departments"]',
    content: 'This pie chart shows which departments book the most lockers. Filter by floor to see department usage for specific floors.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="admin-analytics-popular-floors"]',
    content: 'This bar chart shows the most popular floors. Filter by department to see floor preferences for specific departments.',
    placement: 'bottom',
  },
];

export const ADMIN_BOOKING_RULES_STEPS: Step[] = [
  {
    target: '[data-tour="admin-booking-rules-constraints"]',
    content: (
      <div>
        Configure system-wide booking constraints that apply to all users.
        <br /><br />
        Set maximum booking duration, extension limits, advance booking window, and whether same-day bookings are allowed.
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="admin-booking-rules-save-btn"]',
    content: 'Click here to save your changes to booking rules. The button is only enabled when you have unsaved changes.',
    placement: 'left',
  },
  {
    target: '[data-tour="admin-booking-rules-floor-access"]',
    content: 'Manage floor booking access - view which floors are open or closed for new bookings.',
    placement: 'top',
  },
  {
    target: '[data-tour="admin-booking-rules-floor-row"]',
    content: 'Click the edit button to open or close a floor for bookings. You can set closure dates and provide a reason for the closure.',
    placement: 'bottom',
  },
];

export const ADMIN_LOCKER_CONFIG_STEPS: Step[] = [
  {
    target: '[data-tour="admin-locker-config-floor-selector"]',
    content: 'Select which floor you want to configure. Each floor has its own layout and zones.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="admin-locker-config-zoom"]',
    content: 'Use these controls to zoom in and out on the floor plan for precise positioning.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="admin-locker-config-canvas"]',
    content: (
      <div>
        Drag and drop lockers to reposition them within their zones.
        <br /><br />
        Lockers will snap to nearby positions for easy alignment. You can also pan the canvas by clicking and dragging the background.
      </div>
    ),
    placement: 'top',
  },
  {
    target: '[data-tour="admin-locker-config-actions"]',
    content: 'Save your changes or reset to the original positions if you want to undo your changes.',
    placement: 'left',
  },
];

export const ADMIN_AUDIT_LOGS_STEPS: Step[] = [
  {
    target: '[data-tour="admin-audit-logs-search"]',
    content: 'Search audit logs by employee name or entity reference (locker number, floor, etc.).',
    placement: 'bottom',
  },
  {
    target: '[data-tour="admin-audit-logs-filters"]',
    content: 'Filter audit logs by action type, entity type, and user role. Combine multiple filters to narrow down specific activities.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="admin-audit-logs-table"]',
    content: 'All system activities are logged here with timestamp, user, action, entity type, reference, and change details.',
    placement: 'top',
  },
  {
    target: '[data-tour="admin-audit-log-row"]',
    content: (
      <div>
        Each row shows who performed what action, when it happened, and what changed.
        <br /><br />
        The Details column shows the specific fields that were modified with before and after values.
      </div>
    ),
    placement: 'bottom',
  },
];
