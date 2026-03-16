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

