# 1st feature
Modify the Admin "Add Product" flow as follows:

On the Admin > Add Products page, there is currently a popup where the user:
selects the Category
then clicks Next to move to the next popup/page
Required Change:
In the popup where Select Category is shown:
Do not show the Subcategory input field on the next page
Instead, add the Subcategory input field in the same popup where Category is selected
Expected Behavior:
The Category selection and Subcategory input should appear together in the same popup/modal
The user should not have to go to the next step/page just to enter the Subcategory
The Next button should proceed only after both:
Category is selected
Subcategory is entered (if required)
Goal:
Simplify the product creation flow
Reduce unnecessary navigation between popups/pages
Make category and subcategory management more user-friendly and efficient

# 2nd feature
Prompt for Developer / AI Builder

Update the authentication flow and role visibility so that the Admin login is separated from the normal user-facing signup/login experience.

Current Behavior
The Signup dropdown currently includes the Admin option along with other roles.
This makes the Admin role visible to:
Normal users
Sellers
Delivery boys
Required Change
Remove the Admin option from the Signup dropdown/menu.
Do not show Admin in any public-facing role selection or signup dropdown.
Create a separate login route/link specifically for Admin access.
Updated Flow Requirements
The Signup dropdown should only show roles intended for public users, such as:
Normal User / Customer
Seller
Delivery Boy
The Admin role must not appear in:
Signup dropdown
Public role selection
Any user-facing authentication menu accessible to regular platform users
Admin Access Requirements
Add a separate dedicated Admin login route, for example:
/admin/login
The Admin login should be accessible only through:
A separate hidden/internal link
Admin-specific entry point
Not through the public signup dropdown or user-facing role selector
Security / UX Requirements
Admin access should be isolated from normal authentication flows
Prevent normal users, sellers, and delivery boys from seeing Admin as an available account type
Keep the Admin authentication experience separate and professional
Maintain consistent UI styling for the new Admin login page/route
Ensure existing user, seller, and delivery boy signup/login flows continue working without disruption
Expected Outcome
Public users only see roles relevant to them
Admin is no longer exposed in the public signup dropdown
Admin has a dedicated login path through a separate route
The platform becomes:
More secure
Cleaner in UX
Better role-separated
More professional in access control
Goal
Hide Admin access from public-facing authentication flows
Separate Admin login from normal user/seller/delivery authentication
Improve role-based access control and overall platform security


# 3rd feature 
Add a “Use Voice Command” option in the Add Product flow. Users should be able to click a microphone button, speak product details like name, description, category, subcategory, price, and quantity, and the system should convert the speech into text in a transcript field on the page. Then automatically parse that transcript and auto-fill the product form fields. Before making the product live, show a preview of all filled details so the user can review and edit if needed. Add a “Confirm & Publish” or “Submit Preview” button on the preview screen, and only after clicking that button should the product be submitted and made live on the marketplace. Keep the existing manual form as a fallback.