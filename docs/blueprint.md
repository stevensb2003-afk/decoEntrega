# **App Name**: DecoEntrega

## Core Features:

- Authentication and Roles: Basic log in with user management, just data stored in Firestore collection, no need to authenticate, just use user id and defined password
- Kanban Board: Dynamic Kanban board with columns for tracking ticket status (e.g., Pending, Prepared, En Route, Delivered)
- Ticket Generation: Automatic ticket ID generation (ETG-1, ETG-2...) and a form for order details including name, phone, and Google Maps link. Depending on the creator add the owner of the delivery
- Ticket Validation: A pop-up modal for express customer satisfaction surveys and uploading proof-of-delivery photos via the device's camera. Images are stored in Firebase Storage. This will be located in a button in each ticket
- Route Optimization: Display routes by delivery priority. only for driver user
- Focused Delivery View: Interface that shows a single delivery at a time to the driver
- Historical Ticket Search: Table view of all created tickets, which is enhanced with universal search and filtering by date, vendor, or status
- Automated Data Archival: Use Cloud Functions to automatically hide completed tickets after 4 business days.
- Multiplatform app: Web version and Movil for Driver

## Style Guidelines:

- Primary color: Use a vibrant blue (#29ABE2) to convey trust and efficiency in delivery management.
- Background color: Light blue (#E0F7FA), a very light tint of the primary hue, creating a clean and calming backdrop for the app interface.
- Accent color: Use a complementary orange (#FFB347) to draw attention to important actions and notifications.
- Body and headline font: 'PT Sans' for a modern look that remains approachable.
- Code font: 'Source Code Pro' for displaying code snippets.
- Use clear and recognizable icons to represent ticket statuses, delivery actions, and user roles.
- Employ a clean, card-based layout for the Kanban board and ticket lists to ensure clarity and ease of navigation.
- Use subtle transitions and animations to provide feedback on user interactions, like moving tickets on the Kanban board or submitting forms.