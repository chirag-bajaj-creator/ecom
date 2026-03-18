# Saved Prompts

## 2026-03-12 — Architect Mode Prompt
**Context:** Setting up Claude as principal software architect before any coding begins.
```
You are a principal software architect with 15+ years of experience. Before writing any code, create a detailed implementation plan including: tech stack, folder structure, component breakdown, data flow, and development phases. Wait for my explicit approval before proceeding. Only start coding when I say "let's go".
```

## 2026-03-12 — Iterative Local Testing Approach
**Context:** Ensuring each phase is fully testable on localhost before moving to next phase.
```
one thing i want to do is to take example like in india if we make furniture we see raw 6 to seven times untill it is ready to use so i want to use everything in local host before completing all phases i want basically to do all things of all phases before hands on to the full website before deployment
```

## 2026-03-12 — Save Prompts Instruction
**Context:** Instruction to save all user prompts for future reuse.
```
one thing you should do save in memory when ever i write any prompt in your terminal save it in your file as i will be using them if it is succesful
```

## 2026-03-12 — Create Prompt File in Workspace
**Context:** User asked to create a visible prompt_save.md in the workspace root.
```
create one file in the workspace so that i can see them make prompt_save.md named
```

## 2026-03-12 — Confirm Phase 1 Understanding
**Context:** User checking if I understand the first task before giving "let's go".
```
so do you undertstand what first work you will do now
```

## 2026-03-12 — Reminder to Save Prompts
**Context:** User corrected me for forgetting to save their prompt.
```
again forget save my prompt
```

## 2026-03-12 — Let's Go (Phase 1 Start)
**Context:** User gave approval to start coding Phase 1 — Foundation.
```
let's go
```

## 2026-03-13 — Enable Voice Mode
**Context:** User asked about enabling voice mode in Claude Code.
```
i want to enable claude voice mode
```

## 2026-03-13 — Restart Phase 1 & Memory Check
**Context:** User wants to restart Phase 1 and check if memory was saved.
```
So divided my project into the six phases We have done the first phase also and you have run it also but start it again do you remember I told you to save in your memory
```

## 2026-03-13 — Reminder to Save All Prompts
**Context:** User reminded that every prompt should be saved.
```
And do you remember one thing also saving my I think you forgot saving my each and every pound when I run each and every query
```

## 2026-03-13 — Save Prompts to prompt_save.md
**Context:** User clarified prompts should be saved to prompt_save.md in workspace, and this should be the first task always.
```
hey save promtps in prompt_save.md everytime your first task is to do that
```

## 2026-03-13 — Start Phase 1 (All Three Commands)
**Context:** User approved starting Docker, backend, and frontend for Phase 1 testing.
```
yes start all three commands for phase1 it is done
```

## 2026-03-13 — Why Taking So Long
**Context:** User interrupted because npm install was taking too long.
```
what is problem why taking so long
```

## 2026-03-14 — Start Phase 6
**Context:** User confirmed Phase 5 is done, wants to start Phase 6 (Admin Portal). Asked to review Phase 6 first.
```
So do you remember the phases In this process, there is the process which we have defined. I have done all the five Now there is the think of doing the sixth phase. Of completing the website back end, front end database then moving on to the security and testing. Now we will be focusing on the sixth phase.
```

## 2026-03-14 — Review Phase 6
**Context:** User corrected me — Phase 6 is Admin Portal, not security/testing. Asked to review first.
```
hey you foget my memory rember from claude help what was phase 6
```

## 2026-03-14 — Phase 5 Confirmed Done
**Context:** User confirmed Phase 5 testing is complete.
```
yes phase 5 is done
```

## 2026-03-14 — Cancel Only Before Pickup
**Context:** User wants cancel to only work before delivery boy picks up the order to reduce refund rate.
```
one thing want to make sure that cancel order only when order is not picked up as it reduce the refund rate
```

## 2026-03-14 — All 6 Phases Complete
**Context:** User confirmed full website is built and working.
```
now full website we made it congrats claude code
```

## 2026-03-16 — Localhost MongoDB Connection Error
**Context:** After successful deployment, user tried running locally and got MongoDB connection error. Also reminded about saving prompts.
```
docker compose up -d → MongoDB container running
npm run dev → MongoDB connection error: querySrv ENOTFOUND _mongodb._tcp.74
User says: deployed version works fine, why localhost has problem now? Previously no problem.
```

## 2026-03-16 — React onChange Explanation
**Context:** User asking what onChange with spread operator does.
```
onChange={e => setForm({ ...form, category: e.target.value })} what is the use of this
```

## 2026-03-16 — Custom Category Input for Products
**Context:** User wants to type category name when adding product, no pre-seeded categories. Category should be created if it doesn't exist.
```
i want that i will make categories no pre seeded categories from now on as i am going to production i want to type category and under which product to be listed
```

## 2026-03-16 — Check Admin Products Show on User Side
**Context:** User made changes so admin-added products show on user/customer side. Wants verification.
```
product added in the admin will show in the user i made the changes is there any need to correct it
```

## 2026-03-16 — CI/CD and Deployment Questions
**Context:** User asking if project follows CI/CD and whether Render auto-deploys like Vercel.
```
is my website following cicd
is render also updated or we have to redeploy as vercel auto detects
```

## 2026-03-16 — Delivery Boy Not Getting Orders + WebSocket Error
**Context:** Delivery boy is online but not getting assigned orders. WebSocket connecting to wrong URL (Vercel instead of Render).
```
delivery boy online but not getting order from user, only showing "fetching customer"
WebSocket connecting to wss://ecomclient-mu.vercel.app:5000/ws — WRONG, should be Render backend URL
```

## 2026-03-16 — Only Real Users + Payment Integration Left
**Context:** If delivery boy and WebSocket connections work correctly after fix, only real users and payment integration are left to make the app production-ready.
```
if delivery boy and all connections work now correctly then to make it real only real users and payment integration left
```

## 2026-03-16 — Live Charge Updates Not at Payment
**Context:** Admin sets delivery charge, surge charge, handling charges (4 inputs). These should update live everywhere (wishlist, cart) but NOT change at the time of payment/checkout.
```
one problem delivery charge, surge charge, and charges 4 inputs are there in the charges section of admin they should be update live anytime like when customer in wishlist add to cart but not at the time of payment
```

## 2026-03-16 — Admin Add Product Category Field Error
**Context:** User added category field to AdminProducts.jsx form but getting "name, price, category required" error when submitting.
```
it is saying name price category required when clicking add product form so i want to make the change that i want to make my category and under which products to be listed but and to be updated to the backend database also so i made category field in adminproducts.jsx instead of that but clicking giving the error name product category not found
```

## 2026-03-16 — Remove Password Complexity & Login Rate Limit
**Context:** User wants simple passwords allowed (no complexity rules) and remove the 5 login attempts / 15 min lockout. Document everything in make_future.md before making changes.
```
remove the complex password checks simple password should be allowed and remove the 5 login attempts try again after 15 minutes in that make_future.md write what code you remove and what process you do and new code also before vs after comparsion for code and process shoudl be there
```

## 2026-03-16 — Revamp Admin Add Product Form (Category-First with Multiple Products)
**Context:** User wants to redesign the Admin Add Product form. Instead of adding one product at a time, admin picks/types a category first, then specifies how many products to add under it, and fills details for each product in one form submission.
```
their is image-copy.png i want like to change the form that each category should have the drop down for the fields like name,description,price,stock,imageurl,category and all should in the one form and should be added simulatenously like one category done then their si the fields name,description,price,stock,imageurl,category and the fields and their is the one more field is field number means how much type of differnet products under this category this is how admin add product should change it should show all the products on the user also as i want that it should follow same category in vertcial and products under category card form which is listed and followed by you in my website as we previously made
```

## 2026-03-17 — Bulk Delete All Products
**Context:** User wants a bulk delete option on admin products page to delete all products.
```
i wnat in admin products page to have bulk delet option to delet all prducts
```

## 2026-03-17 — Delete Button for Each User in Admin
**Context:** User wants a delete button per user in admin users page to delete that user and their data.
```
i wnat the delet button for each user in the admin to dleet that user credentials
```

## 2026-03-17 — Signup 400 Error
**Context:** User seeing 400 error on POST /api/v1/auth/signup, asked what the issue is.
```
at process.processTicksAndRejections (node:internal/process/task_queues:85:11) POST /api/v1/auth/signup 400 5.515 ms - 180 what is this issue
```

## 2026-03-17 — Auto Categories Hamburger in Navbar
**Context:** When categories are created via add product or JSON upload, navbar should auto-show a hamburger menu with category names that redirect to products in same homepage style.
```
when certain cetgroies arwe made from add product or add by json the automatice hamburger button should be madfe in the hom page navabr should ahve the cvatgoies name and shoiuld redirect to the products as same style which home page ahs
```

## 2026-03-17 — Admin Changes Reflect on User Side Without Refresh
**Context:** Any admin changes (products, categories, etc.) should reflect live on user side without refreshing.
```
one thing as i make any changes from admin it should reflect in users without rtefreshiung
```

## 2026-03-17 — Move Hamburger After Login for Better UX
**Context:** User wants the categories hamburger menu moved to after the login/profile button for better UX.
```
hamburger should be after login i tis more ux benifit
```

## 2026-03-17 — Prod.json Images Not Showing + Prompt Saving Stopped
**Context:** User asking why product images from prod.json aren't showing on website, and why prompt saving stopped.
```
see my prod.json and why on website when products is hwon why the real imegs which link i put is not showing and why you stopped saving my prompt in prompt_make_cahnges.md
```

## 2026-03-17 — Address Bar on Home Page
**Context:** User wants an address bar on the home page showing existing addresses, add new address option, and detect live location feature.
```
i want you to make the adrss bar on the home page for the user so that he can see the adress it should ahve the existing adress and new adress ope and detect location to detect live location
```

## 2026-03-17 — Search by Name Only
**Context:** User wants search to match product name only, not description.
```
dont search products with product description search with the product name only make change in the search bar
```

## 2026-03-17 — Trending Surge Sign on Product Cards
**Context:** User wants a ╱╲╱ surge sign badge on product cards that are trending (based on trending searches).
```
their should be the surge sign for the tranding products — ╱╲╱ sign for products which are trending
```

## 2026-03-17 — Mock Payment Gateway
**Context:** User wants a full custom mock payment gateway for all 3 methods (Credit/Debit, UPI, COD) with realistic UI but no real money. No external gateway (Stripe not in India, Razorpay needs PAN).
```
make the flow proper to ask for details dummy for credit card debit and upi and cod but no payment real
```

## 2026-03-17 — Delivery Photo Review System for Admin
**Context:** When delivery confirmation photo is flagged for review (low similarity score), it should show in admin's delivery boy page. Admin must approve for earnings to be credited; if rejected, message "contact delivery boy" is sent.
```
delivery confirm pickup image which is being sent when it is flagged for review or any violation it should be reflect in the admin box on delivery boy page if admin accepts then only the delivery boy earns otherwise there should be the message contact delivery boy
```

